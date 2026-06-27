# AI Notes Converter

AI Notes Converter is a Next.js application foundation for turning source material into structured notes in later phases. Phase 0 establishes repository structure, design tokens, shared UI primitives, tooling, and documentation only.

No AI behavior, upload flow, backend API, authentication, file conversion, or business logic is implemented in this phase.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui conventions
- Motion
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Sonner
- Lucide Icons

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The local app runs at `http://localhost:3000` by default.

## Scripts

- `pnpm dev` starts the development server.
- `pnpm build` creates a production build.
- `pnpm start` serves the production build.
- `pnpm lint` runs ESLint.
- `pnpm typecheck` runs TypeScript without emitting files.
- `pnpm format` formats the repository.
- `pnpm format:check` checks formatting.
- `pnpm validate` runs lint, typecheck, and format checks.

## Folder Structure

```text
src/
  app/          Next.js routes, layouts, and app providers.
  features/     Feature-owned UI and logic by product domain.
  shared/       Reusable UI, layouts, icons, and animation tokens.
  hooks/        Cross-feature React hooks.
  services/     Integration boundaries and shared clients.
  lib/          Framework-adjacent helpers.
  styles/       Global CSS and design tokens.
  types/        Cross-feature TypeScript types.
  constants/    Stable shared constants.
  utils/        Pure reusable utilities.
  config/       Application configuration.
```

## Phase Status

Phase 0 is ready for review when `pnpm validate` passes. Phase 1 should begin only after the foundation, architecture, and design system are approved.
