# Story e06s01 — Toolchain: Tailwind + shadcn/ui

**Maturity:** 3 (Countable)
**Type:** feat
**Risk:** P1
**Context:** shadcn/ui is built on Tailwind CSS + Radix UI. Budgeto's AGENTS.md currently forbids Tailwind ("No CSS modules / Tailwind") and uses a single global styles.css. This story adopts the Tailwind + shadcn toolchain and updates the convention so the rest of the remake can use shadcn components.

## Requirements

### ADDED: Tailwind CSS in the client
- The client build includes Tailwind CSS (PostCSS pipeline via Vite) with a `tailwind.config` scanning `client/src`.
- `client/src/styles.css` is refactored to Tailwind's `@tailwind` directives + shadcn CSS variables (no longer the sole styling source).

### ADDED: shadcn/ui initialized
- `components.json` present; `npx shadcn@latest init` run; base components installable into `client/src/components/ui`.
- Required deps present: `class-variance-authority`, `tailwind-merge`, `clsx`, `tailwindcss-animate`, `lucide-react` (already present), and the Radix primitives shadcn pulls in.

### MODIFIED: AGENTS.md styling convention
- **Before:** "No CSS modules / Tailwind — single global styles.css with class-based selectors."
- **After:** Tailwind CSS + shadcn/ui adopted; global styles.css retains Tailwind directives + design tokens. New UI uses shadcn components and Tailwind utilities.

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: shadcn/ui toolchain
  Scenario: Tailwind + shadcn initialize
    Given the client project
    When I run the dev build
    Then Tailwind utilities compile and a shadcn component (e.g. Button) renders styled

  Scenario: Convention updated
    Given AGENTS.md
    Then the "no Tailwind" rule is replaced with the Tailwind + shadcn convention
```

## Out of Scope
- Rewriting all existing pages in this story (covered by e06s02–e06s05).
- Dark mode tokens (deferred, OOS-2).

## Risks
- shadcn CLI may require interactive prompts / network; pin a known-good version and run non-interactively.
- Tailwind v4 vs v3 config differences — choose one and document in AGENTS.md.
