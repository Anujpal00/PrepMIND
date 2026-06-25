"""RAG chat with uploaded materials."""
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db import db
from auth import get_current_user
from mistral_client import mistral
from routes.materials import retrieve_chunks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatReq(BaseModel):
    material_id: str
    message: str = Field(..., min_length=1, max_length=4000)
    language: Optional[str] = "en"  # en | hi


SYSTEM_PROMPT = """You are PrepMind AI, a friendly and clear tutor for Indian government competitive exams.

ANSWER STYLE — follow these rules strictly:
1. Write like a human tutor explaining to a student. Use plain, easy-to-read sentences.
2. Start with a 1-2 sentence direct answer to the question. Then expand if needed.
3. Use short paragraphs. Use bullet points ONLY when listing 3+ distinct items — never for a single fact.
4. Avoid heavy formatting. DO NOT bold every term. Use **bold** only for the 1-2 most important keywords per answer.
5. Do NOT use nested bullets, sub-bullets, or wall-of-bullets responses.
6. Cite source pages naturally at the end of the relevant sentence as [p.3], not after every bullet.
7. If the answer is not in the context, say: "I couldn't find this in your uploaded material — try asking something more specific or upload more notes on this topic."
8. Use ONLY the provided context. Do not invent facts.
9. If user requested Hindi, respond fully in Hindi. Otherwise English.
10. Keep responses focused — aim for 80-200 words unless the user explicitly asks for detail or a summary."""


@router.post("/ask")
async def ask(req: ChatReq, user=Depends(get_current_user)):
    material = await db.materials.find_one(
        {"id": req.material_id, "user_id": user["id"], "is_deleted": False}
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.get("status") != "ready":
        raise HTTPException(status_code=400, detail=f"Material is still {material.get('status')}. Please wait.")

    top = await retrieve_chunks(req.material_id, req.message, top_k=5)
    if not top:
        raise HTTPException(status_code=400, detail="No content retrieved from material")

    context_blocks = "\n\n".join(
        f"[p.{c['page']}] {c['text']}" for c in top
    )
    lang_hint = "Respond in Hindi (हिन्दी)." if req.language == "hi" else "Respond in English."

    user_msg = f"""{lang_hint}

CONTEXT FROM STUDY MATERIAL:
---
{context_blocks}
---

STUDENT QUESTION: {req.message}

Answer using only the context above. Cite pages."""

    answer = await mistral.chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.2,
        max_tokens=1500,
    )

    # Persist
    now = datetime.now(timezone.utc).isoformat()
    msg_id = str(uuid.uuid4())
    await db.chat_messages.insert_many([
        {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "material_id": req.material_id,
            "role": "user",
            "content": req.message,
            "created_at": now,
        },
        {
            "id": msg_id,
            "user_id": user["id"],
            "material_id": req.material_id,
            "role": "assistant",
            "content": answer,
            "citations": [{"page": c["page"], "score": c["score"]} for c in top],
            "created_at": now,
        },
    ])
    return {
        "id": msg_id,
        "answer": answer,
        "citations": [{"page": c["page"], "snippet": c["text"][:200]} for c in top],
    }


@router.get("/history/{material_id}")
async def history(material_id: str, user=Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"user_id": user["id"], "material_id": material_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(500)
    return msgs
