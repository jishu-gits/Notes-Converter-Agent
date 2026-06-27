# Architecture

## Overview

The application uses a feature-based Next.js App Router structure. Shared primitives and infrastructure are kept outside feature folders so future product phases can add capabilities without reshaping the repository.

## Application Structure

```text
src/app
```

Owns route segments, layouts, metadata, and top-level providers. Route files should compose feature components and shared layouts, not contain business logic.

```text
src/features
```

Owns product capabilities by domain:

- `upload` for future file selection and upload workflow UI.
- `converter` for future conversion workspace UI.
- `notes` for future notes viewing and editing UI.
- `export` for future export controls and result UI.
- `settings` for future preferences and configuration UI.

```text
src/shared
```

Owns reusable building blocks:

- `ui` for primitive shadcn-style components.
- `layouts` for reusable layout shells.
- `icons` for icon re-exports.
- `animations` for motion constants.

Other top-level folders separate cross-cutting concerns: `hooks`, `services`, `lib`, `styles`, `types`, `constants`, `utils`, and `config`.

## Component Levels

Primitive components live in `src/shared/ui`. Examples: `Button`, `Card`, `Input`, `Badge`, `Dialog`, and `Tooltip`.

Composite components should combine primitives for reusable patterns and live near their owning feature unless they are truly cross-feature.

Feature components should live inside `src/features/<feature>` and represent user-facing sections such as future upload, converter, notes, export, or settings panels.

## State Management

Local state should be the default for ephemeral UI state such as modal visibility, hover state, tabs, and form field UI.

Global client state should use Zustand only when multiple distant areas need the same client-side value. Examples for later phases include current file metadata, conversion status, theme, and user preferences.

Server state should use TanStack Query for API responses, conversion history, conversion results, and remote cache invalidation.

Forms should use React Hook Form with Zod schemas when validation or submission state is non-trivial.

## Services

`src/services` is the boundary for shared clients and external integrations. Phase 0 includes only query-client setup. Future AI clients, API clients, storage adapters, and telemetry wrappers should be introduced here or inside a feature service folder when ownership is narrow.

## Scalability Strategy

- Keep feature code inside feature folders until it is reused by multiple features.
- Promote reusable UI to `src/shared/ui` only when it is generic and token-driven.
- Keep route files thin and composition-oriented.
- Prefer semantic design tokens over raw colors and one-off CSS.
- Add global state only when local or server state cannot model the need cleanly.
