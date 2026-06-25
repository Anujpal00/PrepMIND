"""Document text extraction and chunking."""
import io
import logging
from typing import List

from pypdf import PdfReader
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


def extract_text(filename: str, data: bytes) -> List[dict]:
    """Returns list of {page, text} dicts."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return _extract_pdf(data)
    if ext == "docx":
        return _extract_docx(data)
    if ext in ("txt", "md"):
        return [{"page": 1, "text": data.decode("utf-8", errors="ignore")}]
    # Fallback: try text decode
    try:
        return [{"page": 1, "text": data.decode("utf-8", errors="ignore")}]
    except Exception:
        return []


def _extract_pdf(data: bytes) -> List[dict]:
    pages = []
    try:
        reader = PdfReader(io.BytesIO(data))
        for i, page in enumerate(reader.pages):
            try:
                txt = page.extract_text() or ""
            except Exception as e:
                logger.warning(f"PDF page {i} extraction failed: {e}")
                txt = ""
            if txt.strip():
                pages.append({"page": i + 1, "text": txt})
    except Exception as e:
        logger.error(f"PDF parse failed: {e}")
    return pages


def _extract_docx(data: bytes) -> List[dict]:
    try:
        doc = DocxDocument(io.BytesIO(data))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return [{"page": 1, "text": text}] if text.strip() else []
    except Exception as e:
        logger.error(f"DOCX parse failed: {e}")
        return []


def chunk_text(pages: List[dict], chunk_size: int = 1000, overlap: int = 150) -> List[dict]:
    """Sliding-window chunker. Returns list of {text, page} chunks."""
    chunks = []
    for p in pages:
        text = p["text"]
        page_num = p["page"]
        if len(text) <= chunk_size:
            if text.strip():
                chunks.append({"text": text.strip(), "page": page_num})
            continue
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            piece = text[start:end].strip()
            if piece:
                chunks.append({"text": piece, "page": page_num})
            if end == len(text):
                break
            start = end - overlap
    return chunks
