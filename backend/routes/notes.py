"""AI Notes and Flashcards generator."""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import db
from auth import get_current_user
from mistral_client import mistral
from routes.materials import get_material_full_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["notes-flashcards"])


class NotesReq(BaseModel):
    material_id: str
    style: Literal["short", "detailed", "one_page", "highlights"] = "short"
    language: Literal["en", "hi"] = "en"


class FlashcardsReq(BaseModel):
    material_id: str
    count: int = Field(15, ge=5, le=50)
    language: Literal["en", "hi"] = "en"


class PlannerReq(BaseModel):
    exam_date: Optional[str] = None  # ISO date
    weak_topics: list[str] = []
    plan_type: Literal["daily", "weekly", "monthly"] = "weekly"


@router.post("/notes")
async def generate_notes(req: NotesReq, user=Depends(get_current_user)):
    m = await db.materials.find_one({"id": req.material_id, "user_id": user["id"], "is_deleted": False})
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if m.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Material not ready")

    text = await get_material_full_text(req.material_id, max_chars=15000)
    style_instructions = {
        "short": "Concise short notes (under 400 words) with clear headings and bullet points.",
        "detailed": "Comprehensive detailed notes (800-1500 words) with sections, sub-points, examples.",
        "one_page": "One-page revision sheet (300-500 words) - only the most exam-critical points.",
        "highlights": "Bullet list of important facts, dates, definitions, and exam-likely topics ONLY.",
    }[req.style]
    lang = "Hindi (हिन्दी)" if req.language == "hi" else "English"

    prompt = f"""You are an expert Indian competitive exam tutor.
Create {style_instructions} in {lang} from the study material below.
Use Markdown formatting with headers (##), bold (**), bullets, and tables where useful.

MATERIAL:
---
{text}
---

Output ONLY the notes, no preamble."""

    content = await mistral.chat(
        messages=[
            {"role": "system", "content": "You create high-quality exam revision notes."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=3000,
    )

    note_id = str(uuid.uuid4())
    doc = {
        "id": note_id,
        "user_id": user["id"],
        "material_id": req.material_id,
        "material_filename": m.get("filename"),
        "style": req.style,
        "language": req.language,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/notes")
async def list_notes(user=Depends(get_current_user)):
    cursor = db.notes.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(200)


@router.post("/flashcards")
async def generate_flashcards(req: FlashcardsReq, user=Depends(get_current_user)):
    m = await db.materials.find_one({"id": req.material_id, "user_id": user["id"], "is_deleted": False})
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    if m.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Material not ready")

    text = await get_material_full_text(req.material_id, max_chars=12000)
    lang = "Hindi (हिन्दी)" if req.language == "hi" else "English"

    prompt = f"""Generate exactly {req.count} flashcards in {lang} from the material below.
Each flashcard has a short question/term (front) and a concise answer/definition (back, 1-3 sentences).
Focus on exam-likely facts, definitions, dates, formulas, and key concepts.

Return STRICT JSON:
{{"flashcards":[{{"front":"...","back":"...","topic":"..."}}]}}

MATERIAL:
---
{text}
---

Output ONLY valid JSON."""
    raw = await mistral.chat(
        messages=[
            {"role": "system", "content": "You generate exam flashcards as valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=3000,
        json_mode=True,
    )
    data = json.loads(raw)
    cards = data.get("flashcards", [])
    if not cards:
        raise HTTPException(status_code=500, detail="No flashcards generated")

    set_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for c in cards:
        docs.append({
            "id": str(uuid.uuid4()),
            "set_id": set_id,
            "user_id": user["id"],
            "material_id": req.material_id,
            "front": c.get("front", ""),
            "back": c.get("back", ""),
            "topic": c.get("topic", ""),
            "language": req.language,
            "created_at": now,
        })
    if docs:
        await db.flashcards.insert_many(docs)
    return {"set_id": set_id, "count": len(docs), "flashcards": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@router.get("/flashcards")
async def list_flashcards(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {
            "_id": "$set_id",
            "count": {"$sum": 1},
            "material_id": {"$first": "$material_id"},
            "created_at": {"$first": "$created_at"},
        }},
        {"$sort": {"created_at": -1}},
    ]
    sets = await db.flashcards.aggregate(pipeline).to_list(100)
    return [{"set_id": s["_id"], **{k: v for k, v in s.items() if k != "_id"}} for s in sets]


@router.get("/flashcards/{set_id}")
async def get_flashcard_set(set_id: str, user=Depends(get_current_user)):
    cards = await db.flashcards.find({"set_id": set_id, "user_id": user["id"]}, {"_id": 0}).to_list(200)
    if not cards:
        raise HTTPException(status_code=404, detail="Set not found")
    return cards


@router.post("/planner")
async def revision_planner(req: PlannerReq, user=Depends(get_current_user)):
    # Pull recent results to identify weak/strong subjects
    results = await db.results.find({"user_id": user["id"]}, {"_id": 0}).sort("submitted_at", -1).to_list(20)
    weak_from_results = []
    if results:
        agg: dict = {}
        for r in results:
            for subj, stats in r.get("by_subject", {}).items():
                if subj not in agg:
                    agg[subj] = {"correct": 0, "total": 0}
                agg[subj]["correct"] += stats.get("correct", 0)
                agg[subj]["total"] += stats.get("total", 0)
        for subj, s in agg.items():
            if s["total"] >= 5:
                acc = s["correct"] / s["total"] * 100
                if acc < 60:
                    weak_from_results.append(f"{subj} ({acc:.0f}%)")

    weak_topics = list(set(req.weak_topics + weak_from_results)) or ["General Awareness", "Quantitative Aptitude"]
    exam_date = req.exam_date or "in 30 days"

    prompt = f"""You are a study coach for Indian government exams ({user.get('target_exam', 'SSC CGL')}).
Create a {req.plan_type} revision plan.
Student's weak topics: {', '.join(weak_topics)}.
Exam date: {exam_date}.

Return a Markdown plan with:
- Heading: # {req.plan_type.title()} Revision Plan
- A day-by-day (or week-by-week) breakdown with concrete tasks (hours, topics, practice tests).
- A 'Focus Areas' section addressing each weak topic.
- A 'Daily Habits' section.

Be specific and actionable. Output ONLY Markdown."""

    plan = await mistral.chat(
        messages=[
            {"role": "system", "content": "You are an exam preparation coach."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=2500,
    )
    plan_id = str(uuid.uuid4())
    doc = {
        "id": plan_id,
        "user_id": user["id"],
        "plan_type": req.plan_type,
        "weak_topics": weak_topics,
        "exam_date": req.exam_date,
        "content": plan,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.plans.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/plans")
async def list_plans(user=Depends(get_current_user)):
    cursor = db.plans.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)
