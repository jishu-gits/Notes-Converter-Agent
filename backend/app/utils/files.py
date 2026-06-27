from __future__ import annotations

from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status


MAX_UPLOAD_SIZE = 25 * 1024 * 1024


async def save_upload_file(upload: UploadFile, destination: Path) -> int:
    total_bytes = 0

    try:
        async with aiofiles.open(destination, "wb") as output:
            while chunk := await upload.read(1024 * 1024):
                total_bytes += len(chunk)

                if total_bytes > MAX_UPLOAD_SIZE:
                    destination.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="PDF must be 25 MB or smaller.",
                    )

                await output.write(chunk)
    finally:
        await upload.close()

    if total_bytes == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    return total_bytes


async def write_text_file(path: Path, content: str) -> None:
    async with aiofiles.open(path, "w", encoding="utf-8") as output:
        await output.write(content)


async def read_text_file(path: Path) -> str:
    async with aiofiles.open(path, encoding="utf-8") as input_file:
        return await input_file.read()


async def is_pdf_signature(path: Path) -> bool:
    async with aiofiles.open(path, "rb") as input_file:
        return await input_file.read(5) == b"%PDF-"
