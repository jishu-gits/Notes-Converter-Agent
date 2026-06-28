# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-28
### Added
- Multi-provider support (Google Gemini & NVIDIA NIM) for AI Markdown generation.
- Python FastAPI backend to handle file extraction, parsing, and LLM requests.
- Automatic fallback provider handling in case of rate-limits or failures.
- File upload drag-and-drop UI with progress animations.
- Markdown live preview and export capabilities (PDF & MD formats).
- Dynamic provider configuration panel in the app shell.
- Full keyboard accessibility and ARIA labels.

### Changed
- Converted Phase 0 foundation into a production-ready Phase 1 application.
- Updated `README.md` and `ARCHITECTURE.md` to reflect new Python backend.
- Optimized Next.js image loading and implemented lazy dynamic imports.

### Removed
- Placeholder UI mockups and unused mock functions.
- Empty states and placeholder components from Phase 0.
