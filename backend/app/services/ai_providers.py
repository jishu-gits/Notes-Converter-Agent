from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Awaitable, Callable, Protocol

from app.core.config import settings


ProviderId = str
StageReporter = Callable[[str, int], Awaitable[None]]


@dataclass(frozen=True)
class ProviderStatus:
    id: ProviderId
    label: str
    model: str
    configured: bool
    selected: bool
    reason: str | None = None


@dataclass(frozen=True)
class GenerationResult:
    markdown: str
    provider_id: ProviderId
    provider_label: str
    fallback_provider_id: ProviderId | None = None


class AIProvider(Protocol):
    id: ProviderId
    label: str

    @property
    def model(self) -> str:
        ...

    def validation_error(self) -> str | None:
        ...

    async def generate_markdown(
        self,
        pdf_path: Path,
        original_filename: str,
        report_stage: StageReporter,
    ) -> str:
        ...


class GeminiProvider:
    id = "gemini"
    label = "Google Gemini"

    @property
    def model(self) -> str:
        return settings.gemini_model

    def validation_error(self) -> str | None:
        if settings.gemini_api_key:
            return None

        return "GEMINI_API_KEY is not configured."

    async def generate_markdown(
        self,
        pdf_path: Path,
        original_filename: str,
        report_stage: StageReporter,
    ) -> str:
        await report_stage("Running AI", 58)
        return await asyncio.to_thread(
            self._generate_markdown_sync,
            pdf_path,
            original_filename,
        )

    def _generate_markdown_sync(self, pdf_path: Path, original_filename: str) -> str:
        validation_error = self.validation_error()

        if validation_error:
            raise RuntimeError(validation_error)

        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        uploaded_file = None

        try:
            uploaded_file = client.files.upload(file=str(pdf_path))
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    build_file_prompt(original_filename),
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


class NvidiaNimProvider:
    id = "nvidia_nim"
    label = "NVIDIA NIM"

    @property
    def model(self) -> str:
        return settings.nvidia_nim_model

    def validation_error(self) -> str | None:
        if not settings.nvidia_nim_api_key:
            return "NVIDIA_NIM_API_KEY is not configured."

        if not settings.nvidia_nim_model:
            return "NVIDIA_NIM_MODEL is not configured."

        return None

    async def generate_markdown(
        self,
        pdf_path: Path,
        original_filename: str,
        report_stage: StageReporter,
    ) -> str:
        validation_error = self.validation_error()

        if validation_error:
            raise RuntimeError(validation_error)

        await report_stage("Extracting text", 34)
        extracted_text = await extract_pdf_text(pdf_path)

        if not extracted_text.strip():
            raise RuntimeError(
                "NVIDIA NIM needs extractable PDF text. Try Gemini for scanned PDFs.",
            )

        await report_stage("Running AI", 62)

        import httpx

        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            response = await client.post(
                f"{settings.nvidia_nim_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.nvidia_nim_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You convert academic source material into clean markdown notes.",
                        },
                        {
                            "role": "user",
                            "content": build_text_prompt(
                                original_filename,
                                extracted_text[: settings.max_extracted_characters],
                            ),
                        },
                    ],
                    "temperature": settings.ai_temperature,
                    "max_tokens": settings.nvidia_nim_max_tokens,
                },
            )

        if response.status_code >= 400:
            raise RuntimeError(read_provider_error(response.text))

        data = response.json()
        markdown = read_chat_completion_text(data)

        if not markdown.strip():
            raise RuntimeError("NVIDIA NIM returned an empty markdown response.")

        return clean_markdown(markdown)


class AIProviderService:
    def __init__(self) -> None:
        providers: list[AIProvider] = [GeminiProvider(), NvidiaNimProvider()]
        self._providers = {provider.id: provider for provider in providers}

    @property
    def provider_ids(self) -> list[ProviderId]:
        return list(self._providers.keys())

    def get_statuses(self, selected_provider: ProviderId | None = None) -> list[ProviderStatus]:
        selected = self.resolve_provider_id(selected_provider)

        return [
            ProviderStatus(
                id=provider.id,
                label=provider.label,
                model=provider.model,
                configured=provider.validation_error() is None,
                selected=provider.id == selected,
                reason=provider.validation_error(),
            )
            for provider in self._providers.values()
        ]

    def get_provider_label(self, provider_id: ProviderId | None) -> str | None:
        if provider_id is None:
            return None

        provider = self._providers.get(provider_id)
        return provider.label if provider else provider_id

    def normalize_requested_provider(self, provider_id: str | None) -> ProviderId | None:
        if not provider_id or provider_id == "auto":
            return None

        if provider_id not in self._providers:
            options = ", ".join(["auto", *self.provider_ids])
            raise ValueError(f"Unknown AI provider '{provider_id}'. Choose one of: {options}.")

        return provider_id

    def resolve_provider_id(self, provider_id: ProviderId | None = None) -> ProviderId:
        requested_provider = self.normalize_requested_provider(
            provider_id or settings.ai_provider,
        )

        if requested_provider:
            return requested_provider

        configured_provider = self._first_configured_provider()
        return configured_provider.id if configured_provider else self.provider_ids[0]

    async def generate_markdown(
        self,
        pdf_path: Path,
        original_filename: str,
        provider_id: ProviderId | None,
        report_stage: StageReporter,
    ) -> GenerationResult:
        requested_provider = self.normalize_requested_provider(provider_id)
        providers = self._candidate_providers(requested_provider)
        errors: list[str] = []

        for index, provider in enumerate(providers):
            validation_error = provider.validation_error()

            if validation_error:
                errors.append(f"{provider.label}: {validation_error}")
                continue

            try:
                await report_stage("Parsing document", 24)
                markdown = await provider.generate_markdown(
                    pdf_path,
                    original_filename,
                    report_stage,
                )
                return GenerationResult(
                    markdown=markdown,
                    provider_id=provider.id,
                    provider_label=provider.label,
                    fallback_provider_id=providers[0].id if index > 0 else None,
                )
            except Exception as exc:
                errors.append(f"{provider.label}: {exc}")

                if not settings.ai_fallback_enabled:
                    break

                await report_stage("Trying fallback provider", 54)

        error_summary = " ".join(errors) if errors else "No provider was available."
        raise RuntimeError(f"No AI provider completed the request. {error_summary}")

    def _candidate_providers(self, requested_provider: ProviderId | None) -> list[AIProvider]:
        preferred = self._providers.get(requested_provider) if requested_provider else None

        if preferred is None:
            preferred = self._providers[self.resolve_provider_id(None)]

        if not settings.ai_fallback_enabled:
            return [preferred]

        fallback_providers = [
            provider
            for provider in self._providers.values()
            if provider.id != preferred.id
        ]
        return [preferred, *fallback_providers]

    def _first_configured_provider(self) -> AIProvider | None:
        return next(
            (
                provider
                for provider in self._providers.values()
                if provider.validation_error() is None
            ),
            None,
        )


def build_file_prompt(original_filename: str) -> str:
    return build_instructions(
        f'Read the uploaded PDF named "{original_filename}" and convert it into clean,\n'
        "well-structured markdown study material.",
    )


def build_text_prompt(original_filename: str, extracted_text: str) -> str:
    return build_instructions(
        f'The text below was extracted from "{original_filename}". Convert it into clean,\n'
        "well-structured markdown study material.\n\n"
        "Extracted source text:\n"
        f"{extracted_text}",
    )


def build_instructions(source_instruction: str) -> str:
    return f"""
You are an expert academic note maker.

{source_instruction}

Requirements:
- Output markdown only.
- Start with a descriptive H1 title.
- Use H2/H3 sections for major ideas.
- Include bullet lists and numbered lists where useful.
- Include tables for comparisons, formulas, timelines, or summaries when useful.
- Use bold or italic emphasis sparingly for important terms.
- Include fenced code blocks only when the source contains code, formulas, commands,
  algorithms, or structured examples.
- Include blockquotes for key takeaways or important warnings.
- Include a short checklist at the end for review tasks.
- Preserve factual details from the source. Do not invent unsupported content.
""".strip()


async def extract_pdf_text(pdf_path: Path) -> str:
    return await asyncio.to_thread(extract_pdf_text_sync, pdf_path)


def extract_pdf_text_sync(pdf_path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    pages: list[str] = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""

        if page_text.strip():
            pages.append(f"## Page {page_number}\n{page_text.strip()}")

        if sum(len(page_content) for page_content in pages) >= settings.max_extracted_characters:
            break

    return "\n\n".join(pages)


def read_chat_completion_text(data: object) -> str:
    if not isinstance(data, dict):
        return ""

    choices = data.get("choices")

    if not isinstance(choices, list) or not choices:
        return ""

    first_choice = choices[0]

    if not isinstance(first_choice, dict):
        return ""

    message = first_choice.get("message")

    if isinstance(message, dict):
        content = message.get("content")

        if isinstance(content, str):
            return content

    text = first_choice.get("text")
    return text if isinstance(text, str) else ""


def read_provider_error(response_text: str) -> str:
    if not response_text.strip():
        return "Provider request failed."

    return response_text[:500]


def clean_markdown(markdown: str) -> str:
    cleaned = markdown.strip()

    if cleaned.startswith("```markdown"):
        cleaned = cleaned.removeprefix("```markdown").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    return cleaned


ai_provider_service = AIProviderService()
