"""PrepMind AI - FastAPI backend entrypoint."""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import client
from storage import init_storage
from auth import router as auth_router
from routes.materials import router as materials_router
from routes.chat import router as chat_router
from routes.questions import router as questions_router
from routes.tests import router as tests_router
from routes.notes import router as notes_router
from routes.analytics import router as analytics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="PrepMind AI", version="1.0.0")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"app": "PrepMind AI", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


api_router.include_router(auth_router)
api_router.include_router(materials_router)
api_router.include_router(chat_router)
api_router.include_router(questions_router)
api_router.include_router(tests_router)
api_router.include_router(notes_router)
api_router.include_router(analytics_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed (will retry on use): {e}")
    # Indexes
    try:
        await client[os.environ["DB_NAME"]].users.create_index("email", unique=True)
        await client[os.environ["DB_NAME"]].materials.create_index([("user_id", 1), ("created_at", -1)])
        await client[os.environ["DB_NAME"]].chunks.create_index("material_id")
        await client[os.environ["DB_NAME"]].results.create_index([("user_id", 1), ("submitted_at", -1)])
    except Exception as e:
        logger.warning(f"Index creation: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
