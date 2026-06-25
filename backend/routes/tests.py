"""Topic tests, mock tests, submissions, results."""
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
from routes.materials import get_material_full_text, get_material_pages_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tests", tags=["tests"])


# ---- Mock test SSC CGL pattern ----
SSC_CGL_PATTERN = {
    "sections": [
        {"name": "General Intelligence & Reasoning", "subject": "General Intelligence", "count": 25, "marks_per_q": 2.0},
        {"name": "Quantitative Aptitude", "subject": "Quantitative Aptitude", "count": 25, "marks_per_q": 2.0},
        {"name": "English Comprehension", "subject": "English", "count": 25, "marks_per_q": 2.0},
        {"name": "General Awareness", "subject": "Current Affairs", "count": 25, "marks_per_q": 2.0},
    ],
    "duration_minutes": 60,
    "negative_marks": 0.5,
}


class CreateTestReq(BaseModel):
    test_type: Literal["topic", "mock"] = "topic"
    exam: str = "SSC CGL"
    subject: Optional[str] = None
    topic: Optional[str] = None
    count: int = Field(10, ge=5, le=100)
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "medium"
    language: Literal["en", "hi"] = "en"


class SubmitTestReq(BaseModel):
    test_id: str
    answers: dict  # question_id -> selected_index | null
    time_taken_seconds: int = 0


async def _generate_questions(exam: str, subject: str, topic: Optional[str], count: int, difficulty: str, language: str) -> List[dict]:
    diff_str = "mixed difficulty (mix of easy, medium, hard)" if difficulty == "mixed" else f"{difficulty} difficulty"
    lang = "Hindi (हिन्दी)" if language == "hi" else "English"
    topic_str = f" Topic: {topic}." if topic else ""

    prompt = f"""You are an expert paper setter for {exam}.
Generate {count} {diff_str} MCQ questions in {lang}.
Subject: {subject}.{topic_str}

Each question has exactly 4 options. Mark the correct option index (0-3).

Return STRICT JSON:
{{
  "questions": [
    {{
      "question": "string",
      "options": ["A","B","C","D"],
      "correct_index": 0,
      "explanation": "brief explanation",
      "topic": "string"
    }}
  ]
}}

Output ONLY valid JSON. No markdown."""
    raw = await mistral.chat(
        messages=[
            {"role": "system", "content": "You produce only valid JSON exam questions."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=6000,
        json_mode=True,
    )
    data = json.loads(raw)
    return data.get("questions", [])


@router.post("/create")
async def create_test(req: CreateTestReq, user=Depends(get_current_user)):
    test_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    questions_doc: List[dict] = []

    if req.test_type == "mock":
        # Full SSC CGL mock
        for section in SSC_CGL_PATTERN["sections"]:
            qs = await _generate_questions(req.exam, section["subject"], None, section["count"], "mixed", req.language)
            for q in qs:
                questions_doc.append({
                    "id": str(uuid.uuid4()),
                    "section": section["name"],
                    "subject": section["subject"],
                    "topic": q.get("topic", section["subject"]),
                    "question": q.get("question", ""),
                    "options": q.get("options", []),
                    "correct_index": q.get("correct_index", 0),
                    "explanation": q.get("explanation", ""),
                    "marks": section["marks_per_q"],
                })
        duration = SSC_CGL_PATTERN["duration_minutes"]
        neg = SSC_CGL_PATTERN["negative_marks"]
        title = f"{req.exam} Full Mock Test"
    else:
        subject = req.subject or "General Awareness"
        qs = await _generate_questions(req.exam, subject, req.topic, req.count, req.difficulty, req.language)
        for q in qs:
            questions_doc.append({
                "id": str(uuid.uuid4()),
                "section": subject,
                "subject": subject,
                "topic": q.get("topic", req.topic or subject),
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "correct_index": q.get("correct_index", 0),
                "explanation": q.get("explanation", ""),
                "marks": 1.0,
            })
        duration = max(10, len(questions_doc))  # ~1 min/Q
        neg = 0.25
        title = f"{subject}{' - ' + req.topic if req.topic else ''} Topic Test"

    if not questions_doc:
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    test_doc = {
        "id": test_id,
        "user_id": user["id"],
        "test_type": req.test_type,
        "title": title,
        "exam": req.exam,
        "subject": req.subject,
        "topic": req.topic,
        "language": req.language,
        "duration_minutes": duration,
        "negative_marks": neg,
        "questions": questions_doc,
        "total_questions": len(questions_doc),
        "status": "ready",
        "created_at": now,
    }
    await db.tests.insert_one(test_doc)
    test_doc.pop("_id", None)
    return test_doc


@router.get("/{test_id}")
async def get_test(test_id: str, user=Depends(get_current_user)):
    t = await db.tests.find_one({"id": test_id, "user_id": user["id"]}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")
    return t


@router.get("")
async def list_tests(user=Depends(get_current_user)):
    cursor = db.tests.find(
        {"user_id": user["id"]},
        {"_id": 0, "questions": 0},
    ).sort("created_at", -1)
    return await cursor.to_list(200)


@router.post("/submit")
async def submit_test(req: SubmitTestReq, user=Depends(get_current_user)):
    t = await db.tests.find_one({"id": req.test_id, "user_id": user["id"]})
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")

    questions = t["questions"]
    neg = t.get("negative_marks", 0)
    total_marks = 0.0
    max_marks = 0.0
    correct = 0
    incorrect = 0
    skipped = 0
    by_subject: dict = {}
    answer_details = []

    for q in questions:
        max_marks += q.get("marks", 1.0)
        subj = q.get("subject", "General")
        if subj not in by_subject:
            by_subject[subj] = {"correct": 0, "incorrect": 0, "skipped": 0, "total": 0}
        by_subject[subj]["total"] += 1

        ans = req.answers.get(q["id"])
        if ans is None or ans == "":
            skipped += 1
            by_subject[subj]["skipped"] += 1
            answer_details.append({"question_id": q["id"], "selected": None, "correct": q["correct_index"], "result": "skipped"})
        elif int(ans) == q["correct_index"]:
            correct += 1
            total_marks += q.get("marks", 1.0)
            by_subject[subj]["correct"] += 1
            answer_details.append({"question_id": q["id"], "selected": int(ans), "correct": q["correct_index"], "result": "correct"})
        else:
            incorrect += 1
            total_marks -= neg
            by_subject[subj]["incorrect"] += 1
            answer_details.append({"question_id": q["id"], "selected": int(ans), "correct": q["correct_index"], "result": "incorrect"})

    accuracy = (correct / len(questions) * 100) if questions else 0
    percent_score = (total_marks / max_marks * 100) if max_marks > 0 else 0

    result_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    result_doc = {
        "id": result_id,
        "user_id": user["id"],
        "test_id": req.test_id,
        "test_title": t.get("title"),
        "test_type": t.get("test_type"),
        "exam": t.get("exam"),
        "total_questions": len(questions),
        "correct": correct,
        "incorrect": incorrect,
        "skipped": skipped,
        "score": round(total_marks, 2),
        "max_marks": round(max_marks, 2),
        "accuracy": round(accuracy, 2),
        "percent_score": round(percent_score, 2),
        "time_taken_seconds": req.time_taken_seconds,
        "by_subject": by_subject,
        "answer_details": answer_details,
        "submitted_at": now,
    }
    await db.results.insert_one(result_doc)
    await db.tests.update_one({"id": req.test_id}, {"$set": {"status": "completed", "result_id": result_id}})

    result_doc.pop("_id", None)
    return result_doc


@router.get("/result/{result_id}")
async def get_result(result_id: str, user=Depends(get_current_user)):
    r = await db.results.find_one({"id": result_id, "user_id": user["id"]}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Result not found")
    # Attach test questions for review
    t = await db.tests.find_one({"id": r["test_id"]}, {"_id": 0, "questions": 1})
    if t:
        r["questions"] = t.get("questions", [])
    return r


@router.get("/results/all")
async def all_results(user=Depends(get_current_user)):
    cursor = db.results.find(
        {"user_id": user["id"]},
        {"_id": 0, "answer_details": 0},
    ).sort("submitted_at", -1)
    return await cursor.to_list(200)


# ===== NEW FEATURE: Extract questions from uploaded PDF and run as mock =====

class ExtractFromPdfReq(BaseModel):
    material_id: str
    pages: Optional[List[int]] = None  # if provided, only extract from these pages


class StartExtractedReq(BaseModel):
    material_id: str
    questions: List[dict]  # extracted question objects from /extract
    title: Optional[str] = None
    duration_minutes: int = Field(30, ge=1, le=300)
    negative_marks: float = Field(0.0, ge=0, le=2)


@router.post("/extract-from-pdf")
async def extract_from_pdf(req: ExtractFromPdfReq, user=Depends(get_current_user)):
    """Extract MCQ-style questions that EXIST in the uploaded material (PYQ papers, question banks)."""
    material = await db.materials.find_one(
        {"id": req.material_id, "user_id": user["id"], "is_deleted": False}
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Material not ready")

    if req.pages:
        text = await get_material_pages_text(req.material_id, req.pages, max_chars=24000)
        page_scope = f"pages {', '.join(str(p) for p in sorted(req.pages))}"
    else:
        text = await get_material_full_text(req.material_id, max_chars=24000)
        page_scope = "the entire document"
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text content in the selected pages")

    prompt = f"""You are extracting questions VERBATIM from an Indian government exam paper / question bank.

The text below is from {page_scope} of a student-uploaded PDF. Extract EVERY multiple-choice question that already exists in the text. Do NOT invent, paraphrase, or guess anything.

CRITICAL RULES:

1. VERBATIM EXTRACTION: Copy the question text EXACTLY as written. Do not shorten, paraphrase, fix grammar, or remove formatting like "Q.1", "1.", or numbering.

2. COMPREHENSION / READING PASSAGES: If a question depends on a passage, paragraph, case-study, statements list, or reading text above it, copy that ENTIRE passage VERBATIM into the `passage` field. The `question` field contains ONLY the actual question after the passage (e.g. "According to the passage, what is…"). Multiple consecutive questions sharing the same passage MUST each carry the full passage text in their own `passage` field.

3. OPTIONS: Exactly 4 options. Copy each option verbatim including any (A)/(B)/1./2. labels — but strip the label so only the answer text remains.

4. ANSWER KEY — MOST IMPORTANT:
   - Set `correct_index` (0=A, 1=B, 2=C, 3=D) ONLY if the answer is EXPLICITLY stated in the visible text — e.g. an answer key section ("Answers: 1-B, 2-C, …"), or an inline marking like "Ans: (C)" or a circled / bolded / starred option.
   - If the answer is NOT explicitly stated anywhere in the text, set `correct_index` to null.
   - DO NOT guess based on your own knowledge. DO NOT pick a likely-looking answer.
   - Set `answer_evidence` to the exact substring from the text that proves the answer (e.g. "Q1. Ans: B" or "Answer Key: 1) C"). If correct_index is null, set this to empty string.

5. SKIP: fill-in-the-blanks, true/false-only questions, essay/descriptive questions, match-the-following, and any question without exactly 4 options.

6. NO DUPLICATES. Limit to 100 questions max.

Return STRICT JSON:
{{
  "questions": [
    {{
      "passage": "Full verbatim passage text if applicable, else empty string",
      "question": "Exact question text verbatim",
      "options": ["opt A text","opt B text","opt C text","opt D text"],
      "correct_index": 2,
      "answer_evidence": "exact substring from text proving the answer",
      "explanation": "explanation if present in text, else empty string",
      "topic": "infer e.g. History/Polity/Reading Comprehension"
    }}
  ]
}}

TEXT:
---
{text}
---

Output ONLY valid JSON. No markdown."""

    try:
        raw = await mistral.chat(
            messages=[
                {"role": "system", "content": "You extract MCQs verbatim from exam papers. You never guess answers — only mark answers that are explicitly stated in the source text. Return strict JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=8000,
            json_mode=True,
        )
        data = json.loads(raw)
    except Exception as e:
        logger.error(f"Extract failed: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    questions = data.get("questions", [])
    clean = []
    skipped_no_answer = 0
    for q in questions:
        if not isinstance(q, dict): continue
        opts = q.get("options") or []
        if len(opts) != 4: continue
        if not q.get("question"): continue
        ci = q.get("correct_index")
        evidence = (q.get("answer_evidence") or "").strip()
        # Only keep questions with a verified answer (correct_index set AND evidence quoted)
        if ci is None or not isinstance(ci, int) or not (0 <= ci <= 3) or not evidence:
            skipped_no_answer += 1
            continue
        clean.append({
            "passage": str(q.get("passage", "") or "").strip(),
            "question": str(q.get("question", "")).strip(),
            "options": [str(o) for o in opts],
            "correct_index": ci,
            "answer_evidence": evidence,
            "explanation": str(q.get("explanation", "") or "").strip(),
            "topic": str(q.get("topic", "") or "").strip(),
        })

    if not clean:
        raise HTTPException(
            status_code=400,
            detail=(
                "No MCQs with a verified answer key found in selected pages. "
                "Tip: make sure the answer key page is also selected, "
                "or the answers are written inline in the PDF (e.g. 'Ans: B')."
            ),
        )

    return {
        "material_id": req.material_id,
        "material_filename": material.get("filename"),
        "extracted_count": len(clean),
        "skipped_no_answer": skipped_no_answer,
        "questions": clean,
    }


@router.post("/start-from-extracted")
async def start_from_extracted(req: StartExtractedReq, user=Depends(get_current_user)):
    """Create a test from extracted (or user-edited) questions with user-chosen duration & negative marks."""
    material = await db.materials.find_one(
        {"id": req.material_id, "user_id": user["id"], "is_deleted": False}
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    if not req.questions:
        raise HTTPException(status_code=400, detail="No questions provided")

    questions_doc = []
    for q in req.questions:
        opts = q.get("options") or []
        if len(opts) != 4 or not q.get("question"):
            continue
        questions_doc.append({
            "id": str(uuid.uuid4()),
            "section": q.get("topic") or "Extracted",
            "subject": q.get("topic") or "From PDF",
            "topic": q.get("topic") or "",
            "passage": q.get("passage", "") or "",
            "question": q["question"],
            "options": [str(o) for o in opts],
            "correct_index": int(q.get("correct_index", 0)),
            "explanation": q.get("explanation", ""),
            "marks": 1.0,
        })

    if not questions_doc:
        raise HTTPException(status_code=400, detail="No valid questions")

    test_id = str(uuid.uuid4())
    title = req.title or f"PDF Mock · {material.get('filename')}"
    test_doc = {
        "id": test_id,
        "user_id": user["id"],
        "test_type": "pdf_extracted",
        "title": title,
        "exam": "From PDF",
        "subject": None,
        "topic": None,
        "language": "en",
        "duration_minutes": req.duration_minutes,
        "negative_marks": req.negative_marks,
        "questions": questions_doc,
        "total_questions": len(questions_doc),
        "status": "ready",
        "source_material_id": req.material_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tests.insert_one(test_doc)
    test_doc.pop("_id", None)
    return test_doc

