# Architecture

## Overview

The Remarker AI application uses a split-stack architecture: a feature-based Next.js App Router frontend, and a FastAPI Python backend. This separation of concerns allows for robust and scalable AI model integration on the backend, while providing a snappy, highly-interactive UI on the frontend.

## Frontend Structure

The frontend uses a Next.js App Router structure.

```text
src/app
```
Owns route segments, layouts, metadata, and top-level providers. Route files compose feature components and shared layouts.

```text
src/components
```
Owns product capabilities by domain, specifically the upload and converter features (`upload-card.tsx`).

```text
src/shared
```
Owns reusable building blocks:
- `ui` for primitive shadcn-style components.
- `layouts` for reusable layout shells (e.g. `app-shell.tsx`).

```text
src/services
```
The boundary for shared clients, such as the `upload-api.ts` which handles all communication with the backend.

### State Management
- **Local State**: Ephemeral UI state such as modal visibility, hover state, and form field UI.
- **Server State**: React Query (TanStack) and native Next.js fetch cache.
- **Provider State**: A custom React context manages the selected AI provider, validating its health against the backend.

## Backend Structure

The backend is built with FastAPI and runs on Python 3.10+.

```text
backend/app
```
The core application folder containing:
- `api/routes.py`: Defines the REST API endpoints.
- `core/config.py`: Centralized environment and application configuration.
- `models/schemas.py`: Pydantic models for request/response validation.
- `services/`: Business logic.
  - `ai_providers.py`: The abstraction layer supporting multiple AI providers (Gemini, NVIDIA NIM).
  - `job_manager.py`: Manages async conversion jobs and tracks their status.

### AI Provider Abstraction
The system supports multiple AI providers through the `AIProvider` protocol. The `AIProviderService` resolves requests, attempts generation using the primary provider, and gracefully falls back to secondary providers if errors occur.

## Scalability Strategy

- Keep feature code cohesive in specific folders.
- Maintain the strict frontend/backend split via REST APIs.
- The AI Provider abstraction makes it easy to drop in new providers (like OpenAI or Anthropic) in the future simply by creating a new class that implements the `AIProvider` protocol.
