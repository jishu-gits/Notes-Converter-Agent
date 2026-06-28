from typing import Literal

from pydantic import BaseModel, Field


JobStatus = Literal["queued", "processing", "completed", "failed"]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    providers: list[str] = Field(default_factory=list)


class ProviderStatusResponse(BaseModel):
    id: str
    label: str
    model: str
    configured: bool
    selected: bool
    reason: str | None = None


class ProviderListResponse(BaseModel):
    default_provider: str
    fallback_enabled: bool
    providers: list[ProviderStatusResponse]


class UploadResponse(BaseModel):
    job_id: str
    provider: str | None = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    message: str
    error: str | None = None
    provider: str | None = None
    provider_label: str | None = None
    fallback_provider: str | None = None
