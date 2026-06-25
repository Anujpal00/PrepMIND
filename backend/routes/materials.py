"""Study material upload, list, delete, and chat-with-doc."""
import uuid
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

import numpy as np

from db import db
from auth import get_current_user
from storage import put_object, APP_NAME
from doc_processor import extract_text, chunk_text
from mistral_client import mistral

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/materials", tags=["materials"])

ALLOWED_EXT = {"pdf", "docx", "txt", "md"}
MAX_SIZE = 25 * 1024 * 1024  # 25MB


@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    subject: str = Form("General"),
    topic: str = Form(""),
    user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type .{ext}. Allowed: pdf, docx, txt, md")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 25MB)")

    material_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['id']}/{material_id}.{ext}"
    try:
        result = put_object(path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Storage upload failed")

    now = datetime.now(timezone.utc).isoformat()
    material_doc = {
        "id": material_id,
        "user_id": user["id"],
        "filename": file.filename,
        "storage_path": result["path"],
        "size": result.get("size", len(data)),
        "content_type": file.content_type or "application/octet-stream",
        "subject": subject,
        "topic": topic,
        "status": "processing",
        "chunk_count": 0,
        "page_count": 0,
        "is_deleted": False,
        "created_at": now,
    }
    await db.materials.insert_one(material_doc)

    # Background processing
    asyncio.create_task(_process_material(material_id, file.filename, data))

    material_doc.pop("_id", None)
    return material_doc


async def _process_material(material_id: str, filename: str, data: bytes):
    try:
        pages = extract_text(filename, data)
        chunks = chunk_text(pages)
        if not chunks:
            await db.materials.update_one(
                {"id": material_id},
                {"$set": {"status": "failed", "error": "No text could be extracted"}},
            )
            return

        # Batch embeddings
        texts = [c["text"] for c in chunks]
        batch_size = 32
        all_embeddings: List[List[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            try:
                emb = await mistral.embed(batch)
                all_embeddings.extend(emb)
            except Exception as e:
                logger.error(f"Embed batch failed: {e}")
                # Pad with zeros to keep alignment
                all_embeddings.extend([[0.0] * 1024 for _ in batch])

        # Store chunks
        chunk_docs = [
            {
                "id": str(uuid.uuid4()),
                "material_id": material_id,
                "page": c["page"],
                "order": idx,
                "text": c["text"],
                "embedding": all_embeddings[idx] if idx < len(all_embeddings) else None,
            }
            for idx, c in enumerate(chunks)
        ]
        if chunk_docs:
            await db.chunks.insert_many(chunk_docs)

        await db.materials.update_one(
            {"id": material_id},
            {
                "$set": {
                    "status": "ready",
                    "chunk_count": len(chunk_docs),
                    "page_count": max((c["page"] for c in chunks), default=0),
                }
            },
        )
        logger.info(f"Material {material_id} processed: {len(chunk_docs)} chunks")
    except Exception as e:
        logger.exception(f"Processing failed for {material_id}: {e}")
        await db.materials.update_one(
            {"id": material_id},
            {"$set": {"status": "failed", "error": str(e)}},
        )


@router.get("")
async def list_materials(user=Depends(get_current_user)):
    cursor = db.materials.find(
        {"user_id": user["id"], "is_deleted": False}, {"_id": 0}
    ).sort("created_at", -1)
    return await cursor.to_list(500)


@router.get("/{material_id}")
async def get_material(material_id: str, user=Depends(get_current_user)):
    m = await db.materials.find_one(
        {"id": material_id, "user_id": user["id"], "is_deleted": False}, {"_id": 0}
    )
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    return m


@router.get("/{material_id}/pages")
async def list_pages(material_id: str, user=Depends(get_current_user)):
    """Return a list of pages with short preview snippets so the user can pick which to use."""
    m = await db.materials.find_one(
        {"id": material_id, "user_id": user["id"], "is_deleted": False}
    )
    if not m:
        raise HTTPException(status_code=404, detail="Material not found")
    chunks = await db.chunks.find(
        {"material_id": material_id},
        {"_id": 0, "page": 1, "text": 1, "order": 1},
    ).sort("order", 1).to_list(5000)
    # Group by page; keep first text snippet
    pages: dict = {}
    for c in chunks:
        p = c.get("page", 1)
        if p not in pages:
            pages[p] = {"page": p, "preview": (c["text"] or "")[:180].replace("\n", " ").strip(), "char_count": 0}
        pages[p]["char_count"] += len(c.get("text", ""))
    out = sorted(pages.values(), key=lambda x: x["page"])
    return {"material_id": material_id, "total_pages": len(out), "pages": out}


@router.delete("/{material_id}")
async def delete_material(material_id: str, user=Depends(get_current_user)):
    res = await db.materials.update_one(
        {"id": material_id, "user_id": user["id"]},
        {"$set": {"is_deleted": True}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"ok": True}


# ---- Retrieval helpers (used by chat & question gen) ----

def _cosine(a: List[float], b: List[float]) -> float:
    av = np.array(a, dtype=np.float32)
    bv = np.array(b, dtype=np.float32)
    na = np.linalg.norm(av)
    nb = np.linalg.norm(bv)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(av, bv) / (na * nb))


async def retrieve_chunks(material_id: str, query: str, top_k: int = 5) -> List[dict]:
    q_emb_list = await mistral.embed([query])
    if not q_emb_list:
        return []
    q_emb = q_emb_list[0]
    chunks = await db.chunks.find(
        {"material_id": material_id}, {"_id": 0}
    ).to_list(5000)
    scored = []
    for c in chunks:
        if not c.get("embedding"):
            continue
        score = _cosine(q_emb, c["embedding"])
        scored.append((score, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"score": s, **{k: v for k, v in c.items() if k != "embedding"}} for s, c in scored[:top_k]]


async def get_material_full_text(material_id: str, max_chars: int = 12000) -> str:
    chunks = await db.chunks.find(
        {"material_id": material_id}, {"_id": 0, "embedding": 0}
    ).sort("order", 1).to_list(5000)
    text = "\n\n".join(c["text"] for c in chunks)
    return text[:max_chars]


async def get_material_pages_text(material_id: str, pages: list, max_chars: int = 24000) -> str:
    """Return concatenated text for only the specified page numbers."""
    chunks = await db.chunks.find(
        {"material_id": material_id, "page": {"$in": pages}},
        {"_id": 0, "embedding": 0},
    ).sort("order", 1).to_list(5000)
    text = "\n\n".join(f"[Page {c['page']}]\n{c['text']}" for c in chunks)
    return text[:max_chars]
