"""Mistral API client for chat completions and embeddings."""
import os
import asyncio
import httpx
import logging
from typing import List

logger = logging.getLogger(__name__)

MISTRAL_API_BASE = "https://api.mistral.ai/v1"


class MistralOverloadedError(Exception):
    """Raised when Mistral upstream is overloaded/rate-limited after all retries."""
    pass


class MistralClient:
    def __init__(self):
        self.api_key = os.environ["MISTRAL_API_KEY"]
        # Use small as primary (5-15s response) to stay under Cloudflare 100s edge timeout.
        # Large model is the fallback for rare quality-sensitive use.
        self.chat_model = os.environ.get("MISTRAL_CHAT_MODEL", "mistral-small-latest")
        self.fallback_model = "mistral-large-latest"
        self.embed_model = os.environ.get("MISTRAL_EMBED_MODEL", "mistral-embed")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(self, messages, temperature=0.3, max_tokens=2000, json_mode=False):
        """Total time budget capped at ~75s to stay under Cloudflare 100s edge timeout."""
        last_err = None
        plan = [(self.chat_model, 2), (self.fallback_model, 1)]
        for model, max_attempts in plan:
            payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
            if json_mode:
                payload["response_format"] = {"type": "json_object"}
            for attempt in range(max_attempts):
                try:
                    async with httpx.AsyncClient(timeout=35.0) as client:
                        r = await client.post(f"{MISTRAL_API_BASE}/chat/completions", headers=self.headers, json=payload)
                    if r.status_code == 200:
                        return r.json()["choices"][0]["message"]["content"]
                    if r.status_code in (429, 500, 502, 503, 504):
                        last_err = f"{r.status_code}: {r.text[:200]}"
                        logger.warning(f"Mistral {model} {r.status_code} (attempt {attempt+1}/{max_attempts})")
                        await asyncio.sleep(1.5)
                        continue
                    logger.error(f"Mistral chat error {r.status_code}: {r.text[:500]}")
                    r.raise_for_status()
                except httpx.TimeoutException as e:
                    logger.warning(f"Mistral {model} timeout: {e}")
                    last_err = f"timeout: {e}"
                    continue
                except httpx.RequestError as e:
                    logger.warning(f"Mistral {model} network error: {e}")
                    last_err = str(e)
                    await asyncio.sleep(1.0)
        # Mistral exhausted — try Groq fallback
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            logger.warning("Mistral exhausted; falling back to Groq")
            try:
                payload = {"model": "llama-3.3-70b-versatile", "messages": messages, "temperature": temperature, "max_tokens": min(max_tokens, 8000)}
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}
                async with httpx.AsyncClient(timeout=45.0) as client:
                    r = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                        json=payload,
                    )
                if r.status_code == 200:
                    return r.json()["choices"][0]["message"]["content"]
                logger.error(f"Groq fallback error {r.status_code}: {r.text[:300]}")
                last_err = f"groq {r.status_code}"
            except Exception as e:
                logger.error(f"Groq fallback failed: {e}")
                last_err = f"groq: {e}"
        raise MistralOverloadedError(f"AI service is currently overloaded. Please try again in a minute. (last: {last_err})")

    async def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    r = await client.post(
                        f"{MISTRAL_API_BASE}/embeddings",
                        headers=self.headers,
                        json={"model": self.embed_model, "input": texts},
                    )
                if r.status_code == 200:
                    return [item["embedding"] for item in r.json()["data"]]
                if r.status_code in (429, 500, 502, 503, 504):
                    await asyncio.sleep((2 ** attempt) * 1.5)
                    continue
                logger.error(f"Mistral embed error {r.status_code}: {r.text[:300]}")
                r.raise_for_status()
            except httpx.RequestError as e:
                logger.warning(f"Embed network error (attempt {attempt+1}): {e}")
                await asyncio.sleep((2 ** attempt) * 1.5)
        raise MistralOverloadedError("Mistral embeddings overloaded — please retry.")


mistral = MistralClient()
