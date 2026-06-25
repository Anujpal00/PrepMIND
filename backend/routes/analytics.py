"""Performance analytics and dashboard stats."""
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from db import db
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    user_id = user["id"]
    materials_count = await db.materials.count_documents({"user_id": user_id, "is_deleted": False})
    notes_count = await db.notes.count_documents({"user_id": user_id})
    tests = await db.results.find(
        {"user_id": user_id}, {"_id": 0, "answer_details": 0}
    ).sort("submitted_at", -1).to_list(50)

    tests_count = len(tests)
    avg_score = (sum(t.get("percent_score", 0) for t in tests) / tests_count) if tests_count else 0
    avg_accuracy = (sum(t.get("accuracy", 0) for t in tests) / tests_count) if tests_count else 0

    # Weak/Strong subjects from all results
    subj_agg: dict = {}
    for r in tests:
        for subj, stats in r.get("by_subject", {}).items():
            if subj not in subj_agg:
                subj_agg[subj] = {"correct": 0, "total": 0}
            subj_agg[subj]["correct"] += stats.get("correct", 0)
            subj_agg[subj]["total"] += stats.get("total", 0)
    subject_accuracy = []
    for s, v in subj_agg.items():
        if v["total"] > 0:
            subject_accuracy.append({
                "subject": s,
                "accuracy": round(v["correct"] / v["total"] * 100, 1),
                "attempts": v["total"],
            })
    subject_accuracy.sort(key=lambda x: x["accuracy"])
    weak = subject_accuracy[:3]
    strong = subject_accuracy[-3:][::-1] if len(subject_accuracy) >= 1 else []

    # Streak (simple: count distinct days in last 30 days with any activity)
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    days = set()
    for r in tests:
        if r.get("submitted_at", "") > since:
            days.add(r["submitted_at"][:10])
    streak = len(days)

    # Recent tests for chart
    recent = [
        {
            "title": t.get("test_title"),
            "score": t.get("percent_score", 0),
            "accuracy": t.get("accuracy", 0),
            "submitted_at": t.get("submitted_at"),
        }
        for t in tests[:10][::-1]
    ]

    return {
        "stats": {
            "materials": materials_count,
            "tests_taken": tests_count,
            "notes_generated": notes_count,
            "avg_score": round(avg_score, 1),
            "avg_accuracy": round(avg_accuracy, 1),
            "study_streak": streak,
        },
        "weak_topics": weak,
        "strong_topics": strong,
        "subject_accuracy": subject_accuracy,
        "recent_tests": recent,
        "user": {
            "name": user["name"],
            "target_exam": user.get("target_exam"),
        },
    }
