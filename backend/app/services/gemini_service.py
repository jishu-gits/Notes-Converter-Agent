from __future__ import annotations

import asyncio
from pathlib import Path

from app.core.config import settings


class GeminiService:
    async def generate_markdown(self, pdf_path: Path, original_filename: str) -> str:
        return await asyncio.to_thread(
            self._generate_markdown_sync,
            pdf_path,
            original_filename,
        )

    def _generate_markdown_sync(self, pdf_path: Path, original_filename: str) -> str:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        uploaded_file = None

        try:
            uploaded_file = client.files.upload(file=str(pdf_path))
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    build_prompt(original_filename),
                    uploaded_file,
                ],
            )
            markdown = getattr(response, "text", "") or ""
        finally:
            if uploaded_file is not None:
                try:
                    client.files.delete(name=uploaded_file.name)
                except Exception:
                    pass

        if not markdown.strip():
            raise RuntimeError("Gemini returned an empty markdown response.")

        return clean_markdown(markdown)


def build_prompt(original_filename: str) -> str:
    return f"""
You are an expert academic note maker.

Read the uploaded PDF named "{original_filename}" and convert it into clean,
well-structured markdown study material.

Requirements:
- Output markdown only.
- Start with a descriptive H1 title.
- Use H2/H3 sections for major ideas.
- Include bullet lists and numbered lists where useful.
- Include tables for comparisons, formulas, timelines, or summaries when useful.
- Use bold or italic emphasis sparingly for important terms.
- Include fenced code blocks only when the PDF contains code, formulas, commands,
  algorithms, or structured examples.
- Include blockquotes for key takeaways or important warnings.
- Include a short checklist at the end for review tasks.
- Preserve factual details from the PDF. Do not invent unsupported content.
""".strip()


def clean_markdown(markdown: str) -> str:
    cleaned = markdown.strip()

    if cleaned.startswith("```markdown"):
        cleaned = cleaned.removeprefix("```markdown").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    return cleaned


gemini_service = GeminiService()
