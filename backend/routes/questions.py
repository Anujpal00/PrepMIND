"""AI Question generation from materials or exam patterns."""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import db
from auth import get_current_user
from mistral_client import mistral
from routes.materials import get_material_full_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/questions", tags=["questions"])


EXAM_TYPES = ["SSC CGL", "SSC CHSL", "UPSC", "DSSSB", "Banking", "Railway", "State PCS"]
SUBJECTS = ["History", "Geography", "Polity", "Economics", "Science", "Current Affairs", "Quantitative Aptitude", "English", "General Intelligence"]


class GenerateReq(BaseModel):
    material_id: Optional[str] = None
    exam: str = "SSC CGL"
    subject: Optional[str] = None
    topic: Optional[str] = None
    question_type: Literal["mcq", "true_false", "assertion_reason"] = "mcq"
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = Field(10, ge=1, le=50)
    language: Literal["en", "hi"] = "en"


def _build_prompt(req: GenerateReq, context: str) -> str:
    lang = "Hindi (हिन्दी)" if req.language == "hi" else "English"
    type_instr = {
        "mcq": "Each question has exactly 4 options (A, B, C, D). Mark the correct option index (0-3).",
        "true_false": "Each question is a statement. correct_index is 0 (True) or 1 (False). options must be exactly [\"True\", \"False\"].",
        "assertion_reason": "Each question has an Assertion (A) and Reason (R) and 4 standard options: 0='Both A and R are true and R is correct explanation of A', 1='Both A and R are true but R is not the correct explanation', 2='A is true but R is false', 3='A is false but R is true'.",
    }[req.question_type]

    context_block = f"\nSTUDY MATERIAL CONTEXT (base questions on this when possible):\n---\n{context}\n---\n" if context else ""

    return f"""You are an expert {req.exam} exam paper setter for Indian government competitive exams.
Generate {req.count} {req.difficulty.upper()} difficulty {req.question_type.upper()} questions in {lang}.
Subject: {req.subject or 'General'}. Topic: {req.topic or 'General'}.

{type_instr}
{context_block}
Return STRICT JSON with this schema:
{{
  "questions": [
    {{
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "1-2 sentence explanation",
      "topic": "string"
    }}
  ]
}}

Rules:
- Questions must resemble actual {req.exam} exam patterns.
- No duplicate questions.
- Explanations must be factually correct and concise.
- Output ONLY valid JSON, no markdown fences."""


@router.post("/generate")
async def generate(req: GenerateReq, user=Depends(get_current_user)):
    context = ""
    if req.material_id:
        material = await db.materials.find_one(
            {"id": req.material_id, "user_id": user["id"], "is_deleted": False}
        )
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        if material.get("status") != "ready":
            raise HTTPException(status_code=400, detail="Material not ready")
        context = await get_material_full_text(req.material_id, max_chars=10000)

    prompt = _build_prompt(req, context)

    try:
        raw = await mistral.chat(
            messages=[
                {"role": "system", "content": "You produce only valid JSON exam questions."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=4000,
            json_mode=True,
        )
        data = json.loads(raw)
    except Exception as e:
        logger.error(f"Question gen failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")

    questions = data.get("questions", [])
    if not questions:
        raise HTTPException(status_code=500, detail="No questions generated")

    # Persist to question bank
    set_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    q_docs = []
    for q in questions:
        q_docs.append({
            "id": str(uuid.uuid4()),
            "set_id": set_id,
            "user_id": user["id"],
            "exam": req.exam,
            "subject": req.subject,
            "topic": q.get("topic") or req.topic,
            "question_type": req.question_type,
            "difficulty": req.difficulty,
            "language": req.language,
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "correct_index": q.get("correct_index", 0),
            "explanation": q.get("explanation", ""),
            "material_id": req.material_id,
            "created_at": now,
        })
    if q_docs:
        await db.questions.insert_many(q_docs)

    return {
        "set_id": set_id,
        "count": len(q_docs),
        "questions": [{k: v for k, v in d.items() if k != "_id"} for d in q_docs],
    }


@router.get("/sets")
async def list_sets(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$group": {
            "_id": "$set_id",
            "count": {"$sum": 1},
            "exam": {"$first": "$exam"},
            "subject": {"$first": "$subject"},
            "topic": {"$first": "$topic"},
            "difficulty": {"$first": "$difficulty"},
            "question_type": {"$first": "$question_type"},
            "created_at": {"$first": "$created_at"},
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": 100},
    ]
    sets = await db.questions.aggregate(pipeline).to_list(100)
    return [{"set_id": s["_id"], **{k: v for k, v in s.items() if k != "_id"}} for s in sets]


@router.get("/set/{set_id}")
async def get_set(set_id: str, user=Depends(get_current_user)):
    qs = await db.questions.find(
        {"set_id": set_id, "user_id": user["id"]}, {"_id": 0}
    ).to_list(500)
    if not qs:
        raise HTTPException(status_code=404, detail="Set not found")
    return qs
