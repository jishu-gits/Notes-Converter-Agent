# Design System

## Principles

The interface should feel calm, legible, and work-focused. Components use semantic tokens so light mode and dark mode can evolve without rewriting component classes.

## Color Tokens

Tokens are defined in `src/styles/globals.css`.

- `background` and `foreground` define the page base.
- `card` and `card-foreground` define framed content.
- `popover` and `popover-foreground` define floating surfaces.
- `primary`, `secondary`, `accent`, `muted`, and their foreground tokens define product UI roles.
- `destructive`, `success`, and `warning` define semantic status states.
- `border`, `input`, and `ring` define interaction chrome.
- `surface`, `surface-raised`, and `surface-sunken` define layered app surfaces.

Do not hardcode colors inside components. Use Tailwind classes backed by semantic tokens, such as `bg-background`, `text-foreground`, `border-border`, or `bg-card`.

## Typography

- Font family: system sans stack through `--font-family-sans`.
- Page titles: `text-3xl` to `text-4xl`, semibold.
- Section and card titles: `text-base` to `text-lg`, semibold.
- Body text: `text-sm` to `text-base` with comfortable line height.
- Letter spacing remains normal for readability.

## Spacing

Use Tailwind spacing with the shared mental scale:

- `xs`: `0.25rem`
- `sm`: `0.5rem`
- `md`: `1rem`
- `lg`: `1.5rem`
- `xl`: `2rem`
- `2xl`: `3rem`

## Radius

The base radius is `0.5rem`. Cards and dialogs use `rounded-lg`; controls use `rounded-md`; small labels use `rounded-sm`.

## Elevation

- `shadow-elevation-1` for cards and controls.
- `shadow-elevation-2` for tooltips and raised overlays.
- `shadow-elevation-3` for dialogs and high-priority floating surfaces.

## Components

Primitive components currently live in `src/shared/ui`:

- `Button`
- `Card`
- `Input`
- `Badge`
- `Dialog`
- `Tooltip`

New primitives should follow shadcn/ui conventions, support variants through `class-variance-authority` where useful, and rely on semantic tokens.

## Animation Rules

- Fast interactions: `120ms`.
- Standard UI transitions: `180ms`.
- Entrances and exits: `260ms`.
- Use `--ease-standard` for ordinary transitions.
- Use `--ease-emphasized` for entrances and layout emphasis.

Animations should be subtle, interruptible, and GPU-friendly. Prefer opacity and transform changes. Respect reduced motion. Avoid elaborate landing-page animation in foundation work.
