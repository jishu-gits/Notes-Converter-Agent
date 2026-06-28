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


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    return value.lower() not in {"0", "false", "no", "off"}


@dataclass(frozen=True)
class Settings:
    ai_provider: str
    ai_fallback_enabled: bool
    ai_request_timeout_seconds: float
    ai_temperature: float
    gemini_api_key: str | None
    gemini_model: str
    nvidia_nim_api_key: str | None
    nvidia_nim_model: str
    nvidia_nim_base_url: str
    nvidia_nim_max_tokens: int
    max_extracted_characters: int
    upload_directory: Path
    output_directory: Path
    host: str
    port: int
    cors_origins: list[str]


settings = Settings(
    ai_provider=os.getenv("AI_PROVIDER", "auto"),
    ai_fallback_enabled=_read_bool("AI_FALLBACK_ENABLED", True),
    ai_request_timeout_seconds=float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "120")),
    ai_temperature=float(os.getenv("AI_TEMPERATURE", "0.2")),
    gemini_api_key=os.getenv("GEMINI_API_KEY"),
    gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"),
    nvidia_nim_api_key=os.getenv("NVIDIA_NIM_API_KEY"),
    nvidia_nim_model=os.getenv(
        "NVIDIA_NIM_MODEL",
        "meta/llama-3.1-70b-instruct",
    ),
    nvidia_nim_base_url=os.getenv(
        "NVIDIA_NIM_BASE_URL",
        "https://integrate.api.nvidia.com/v1",
    ),
    nvidia_nim_max_tokens=int(os.getenv("NVIDIA_NIM_MAX_TOKENS", "4096")),
    max_extracted_characters=int(os.getenv("MAX_EXTRACTED_CHARACTERS", "90000")),
    upload_directory=_resolve_directory(os.getenv("UPLOAD_DIRECTORY"), "uploads"),
    output_directory=_resolve_directory(os.getenv("OUTPUT_DIRECTORY"), "outputs"),
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8000")),
    cors_origins=_read_cors_origins(),
)
