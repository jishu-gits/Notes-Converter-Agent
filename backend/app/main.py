from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.ai_providers import ai_provider_service


app = FastAPI(
    title="AI Notes Converter API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    configured_providers = [
        provider.id
        for provider in ai_provider_service.get_statuses()
        if provider.configured
    ]
    return HealthResponse(status="ok", providers=configured_providers)


app.include_router(router)
