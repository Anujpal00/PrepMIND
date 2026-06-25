"""Mistral API client for chat completions and embeddings."""
import os
import httpx
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

MISTRAL_API_BASE = "https://api.mistral.ai/v1"


class MistralClient:
    def __init__(self):
        self.api_key = os.environ["MISTRAL_API_KEY"]
        self.chat_model = os.environ.get("MISTRAL_CHAT_MODEL", "mistral-large-latest")
        self.embed_model = os.environ.get("MISTRAL_EMBED_MODEL", "mistral-embed")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        messages: List[dict],
        temperature: float = 0.3,
        max_tokens: int = 2000,
        json_mode: bool = False,
    ) -> str:
        payload = {
            "model": self.chat_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{MISTRAL_API_BASE}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            if r.status_code >= 400:
                logger.error(f"Mistral chat error: {r.status_code} {r.text}")
                r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]

    async def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        # Mistral embed accepts batch
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{MISTRAL_API_BASE}/embeddings",
                headers=self.headers,
                json={"model": self.embed_model, "input": texts},
            )
            if r.status_code >= 400:
                logger.error(f"Mistral embed error: {r.status_code} {r.text}")
                r.raise_for_status()
            data = r.json()
            return [item["embedding"] for item in data["data"]]


mistral = MistralClient()
