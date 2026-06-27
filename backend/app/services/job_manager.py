from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.models.schemas import JobStatus


@dataclass
class Job:
    job_id: str
    original_filename: str
    upload_path: Path
    output_path: Path
    status: JobStatus
    progress: int
    message: str
    error: str | None = None


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = asyncio.Lock()

    async def create(self, original_filename: str) -> Job:
        job_id = uuid4().hex
        job = Job(
            job_id=job_id,
            original_filename=Path(original_filename).name or "upload.pdf",
            upload_path=settings.upload_directory / f"{job_id}.pdf",
            output_path=settings.output_directory / f"{job_id}.md",
            status="queued",
            progress=0,
            message="Queued",
        )

        async with self._lock:
            self._jobs[job_id] = job

        return job

    async def get(self, job_id: str) -> Job | None:
        async with self._lock:
            return self._jobs.get(job_id)

    async def update(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        progress: int | None = None,
        message: str | None = None,
        error: str | None = None,
    ) -> Job | None:
        async with self._lock:
            job = self._jobs.get(job_id)

            if job is None:
                return None

            if status is not None:
                job.status = status
            if progress is not None:
                job.progress = max(0, min(100, progress))
            if message is not None:
                job.message = message
            if error is not None:
                job.error = error

            return job

    async def delete(self, job_id: str) -> Job | None:
        async with self._lock:
            return self._jobs.pop(job_id, None)


job_manager = JobManager()
