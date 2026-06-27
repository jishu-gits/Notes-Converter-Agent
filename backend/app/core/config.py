from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


def _resolve_directory(value: str | None, fallback: str) -> Path:
    directory = Path(value or fallback)

    if not directory.is_absolute():
        directory = BACKEND_ROOT / directory

    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _read_cors_origins() -> list[str]:
    origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    return [item.strip() for item in origin.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None
    gemini_model: str
    upload_directory: Path
    output_directory: Path
    host: str
    port: int
    cors_origins: list[str]


settings = Settings(
    gemini_api_key=os.getenv("GEMINI_API_KEY"),
    gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"),
    upload_directory=_resolve_directory(os.getenv("UPLOAD_DIRECTORY"), "uploads"),
    output_directory=_resolve_directory(os.getenv("OUTPUT_DIRECTORY"), "outputs"),
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8000")),
    cors_origins=_read_cors_origins(),
)
