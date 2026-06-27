from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse
from starlette import status

from app.models.schemas import JobStatusResponse, UploadResponse
from app.services.gemini_service import gemini_service
from app.services.job_manager import Job, job_manager
from app.utils.files import (
    is_pdf_signature,
    read_text_file,
    save_upload_file,
    write_text_file,
)

router = APIRouter()


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A PDF file is required.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    job = await job_manager.create(file.filename)

    try:
        await save_upload_file(file, job.upload_path)
        if not await is_pdf_signature(job.upload_path):
            job.upload_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a valid PDF.",
            )
    except Exception:
        await job_manager.delete(job.job_id)
        raise

    await job_manager.update(
        job.job_id,
        status="queued",
        progress=5,
        message="Queued",
    )
    background_tasks.add_task(process_job, job.job_id)

    return UploadResponse(job_id=job.job_id)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str) -> JobStatusResponse:
    job = await require_job(job_id)
    return to_status_response(job)


@router.get("/jobs/{job_id}/markdown", response_class=PlainTextResponse)
async def get_markdown(job_id: str) -> PlainTextResponse:
    job = await require_completed_job(job_id)

    if not job.output_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated markdown was not found.",
        )

    return PlainTextResponse(await read_text_file(job.output_path))


@router.get("/jobs/{job_id}/download/md")
async def download_markdown(job_id: str) -> FileResponse:
    job = await require_completed_job(job_id)

    if not job.output_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated markdown was not found.",
        )

    return FileResponse(
        job.output_path,
        media_type="text/markdown",
        filename=f"{Path(job.original_filename).stem}.md",
    )


@router.get("/jobs/{job_id}/download/pdf")
async def download_pdf(job_id: str) -> FileResponse:
    job = await require_job(job_id)

    if not job.upload_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded PDF was not found.",
        )

    return FileResponse(
        job.upload_path,
        media_type="application/pdf",
        filename=job.original_filename,
    )


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str) -> Response:
    job = await job_manager.delete(job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job was not found.",
        )

    job.upload_path.unlink(missing_ok=True)
    job.output_path.unlink(missing_ok=True)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


async def process_job(job_id: str) -> None:
    job = await job_manager.get(job_id)

    if job is None:
        return

    try:
        await job_manager.update(
            job_id,
            status="processing",
            progress=20,
            message="Extracting text",
        )
        markdown = await gemini_service.generate_markdown(
            job.upload_path,
            job.original_filename,
        )
        await job_manager.update(
            job_id,
            status="processing",
            progress=85,
            message="Formatting",
        )
        await write_text_file(job.output_path, markdown)
        await job_manager.update(
            job_id,
            status="completed",
            progress=100,
            message="Completed",
        )
    except Exception as exc:
        await job_manager.update(
            job_id,
            status="failed",
            progress=100,
            message="Failed",
            error=str(exc),
        )


async def require_job(job_id: str) -> Job:
    job = await job_manager.get(job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job was not found.",
        )

    return job


async def require_completed_job(job_id: str) -> Job:
    job = await require_job(job_id)

    if job.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=job.error or "Job failed.",
        )

    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is not complete yet.",
        )

    return job


def to_status_response(job: Job) -> JobStatusResponse:
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        error=job.error,
    )
