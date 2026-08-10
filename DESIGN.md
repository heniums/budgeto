---
name: Budgeto
description: Memphis-style finance PWA with cream canvas, hard 2px ink strokes, and finance-green tint
colors:
  primary: "hsl(152 76% 38%)"
  primary-foreground: "hsl(0 0% 100%)"
  background: "hsl(60 30% 96%)"
  foreground: "hsl(160 30% 8%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(160 30% 8%)"
  secondary: "hsl(152 40% 92%)"
  secondary-foreground: "hsl(160 30% 8%)"
  muted: "hsl(60 20% 92%)"
  muted-foreground: "hsl(160 12% 35%)"
  accent: "hsl(48 96% 56%)"
  accent-foreground: "hsl(160 30% 8%)"
  destructive: "hsl(0 78% 50%)"
  destructive-foreground: "hsl(0 0% 100%)"
  border: "hsl(0 0% 8%)"
  input: "hsl(0 0% 8%)"
  ring: "hsl(152 76% 38%)"
typography:
  display:
    fontFamily: "Fraunces, system-ui, sans-serif"
    fontWeight: "900"
  body:
    fontFamily: "Fraunces, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: "400"
  mono:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  card: "1rem"
  button: "0.75rem"
  pill: "9999px"
boxShadow:
  card: "6px 6px 0 0 hsl(0 0% 8%)"
  button: "4px 4px 0 0 hsl(0 0% 8%)"
---

# Design System: Budgeto

## Overview

**Creative North Star: "The Memphis Vault"**

A finance app that wears its craft on the surface. Cream canvas with hard black 2px ink strokes, panels that lift via offset drop shadows rather than blur, and a finance-green primary that owns the CTA. Yellow accent on the floating action button and net-cash signals. The UI is flat, deliberate, and structurally loud — every surface is a panel, every panel has a border, every border has a shadow.

**Key Characteristics:**
- Cream background (`hsl(60 30% 96%)`) with a faint dot-grid pattern (`canvas-dots` utility).
- Memphis-styled decorative SVG shapes (square, triangle, circle, ruler, accent triangle) scattered behind the page via the `MemphisBackground` component, mounted once in `main.tsx`.
- 2px solid `hsl(0 0% 8%)` borders on every card, button, input, dialog, sheet, and popover.
- 6px hard offset drop shadow on cards (4px on buttons, hover/active translate to simulate pressing).
- Display typography: Fraunces 900. Body: Fraunces. Code: JetBrains Mono.
- Finance-green primary (`hsl(152 76% 38%)`) for CTAs, selected states, and active nav. Yellow accent (`hsl(48 96% 56%)`) for the FAB and net signals.
- Default theme is light; the `.dark` class resolves to the same Memphis palette (the dark class is preserved for boot-script compatibility).
- shadcn/ui primitives are kept in `client/src/components/ui/` untouched. The Memphis-styled fork lives in `client/src/components/memphis/` and is the only consumer-facing primitive shell.

## Colors

Finance-green primary on a cream canvas. No gradients, no dark surfaces, no glass.

### Primary
- **Finance Green** (`hsl(152 76% 38%)`): CTAs, selected nav, primary buttons, progress fills, ring focus.

### Accent
- **Memphis Yellow** (`hsl(48 96% 56%)`): Floating action button, net-cash signals, chart `net` line, hero eyebrow pill.

### Secondary
- **Mint Tint** (`hsl(152 40% 92%)`): Secondary buttons, hover surfaces, chip backgrounds.

### Neutral
- **Cream Canvas** (`hsl(60 30% 96%)`): Page background with the `canvas-dots` overlay.
- **White Card** (`hsl(0 0% 100%)`): Card and panel fill.
- **Ink** (`hsl(0 0% 8%)`): 2px borders, decorative strokes, button text on accent.
- **Muted Text** (`hsl(160 12% 35%)`): Labels and secondary copy.

### Semantic
- **Destructive** (`hsl(0 78% 50%)`): Delete actions, expense values.

## Typography

**Font Stack:** `Fraunces, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Character:** Confident, grounded, editorial. Memphist-weight display sans for headings and numbers; the same family for body text; JetBrains Mono for code.

### Hierarchy
- **Display** (Fraunces 900, clamp 1.875–6rem): Page hero, page headings.
- **Title** (Fraunces 700, 1.5rem): Card titles.
- **Body** (Fraunces 400, 0.875rem): Form labels, table content, descriptions.
- **Label** (Fraunces 500, 0.75rem, -0.01em, uppercase tracking): Badges, sidebar items.

## Layout

- **App Shell:** Fixed left sidebar (240px desktop) with cream card + 2px ink border + offset shadow. Right column on a `canvas-dots` cream background. Sidebar collapses to a topbar+drawer on mobile (< 768px).
- **Dashboard Grid:** Existing `useGridColumns` hook drives the widget grid; widgets render as memphis cards.
- **Cards:** 1rem radius, 2px border, 6px offset shadow. Internal padding 1rem.
- **Auth Pages:** Centered card on canvas-dots cream, max-width 400px.

## Elevation & Depth

**Philosophy: Hard offset shadows, no blur.** Surfaces lift via `box-shadow: 6px 6px 0 0 hsl(0 0% 8%)` (cards) or `4px 4px 0 0 hsl(0 0% 8%)` (buttons). Hover/active states translate the element in tandem, simulating a physical press.

### Shadow Vocabulary
| Element | Shadow |
|---|---|
| Card | `6px 6px 0 0 hsl(0 0% 8%)` |
| Button | `4px 4px 0 0 hsl(0 0% 8%)` |
| Floating CTA | `4px 4px 0 0 hsl(0 0% 8%)` |

### Memphis Utilities
```css
.memphis-card {
  background: hsl(var(--card));
  border: 2px solid hsl(var(--border));
  border-radius: 1rem;
  box-shadow: 6px 6px 0 0 hsl(var(--border));
}
.memphis-btn-shadow {
  box-shadow: 4px 4px 0 0 hsl(var(--border));
}
.memphis-btn-shadow:hover {
  box-shadow: 2px 2px 0 0 hsl(var(--border));
  transform: translate(2px, 2px);
}
.memphis-btn-shadow:active {
  box-shadow: 0 0 0 0 hsl(var(--border));
  transform: translate(4px, 4px);
}
.canvas-dots {
  background-color: hsl(var(--background));
  background-image: radial-gradient(hsl(var(--canvas-dot)) 1.2px, transparent 1.2px);
  background-size: 22px 22px;
}
```

## Shapes

- **Card radius:** `1rem` (16px). Consistent across all card surfaces.
- **Button radius:** `0.75rem` via `rounded-md`.
- **Input radius:** `0.75rem` via `rounded-md`.
- **Badge / Pill radius:** `9999px` via `rounded-full`.
- **Decorative shapes:** Memphis-style square, triangle, circle, ruler, and accent triangle are rendered behind the page via `MemphisBackground` (mounted once in `main.tsx`).

## Components

### Buttons
- **Shape:** `rounded-md` (12px), 2px ink border.
- **Default:** `bg-primary text-primary-foreground` with `memphis-btn-shadow`. Hover/active translate inward.
- **Outline:** `bg-card text-foreground border-2 border-border memphis-btn-shadow`.
- **Destructive:** `bg-destructive text-destructive-foreground border-2 border-border`.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px).
- **Background:** `hsl(var(--card))`.
- **Border + Shadow:** `memphis-card` utility (2px ink border + 6px offset shadow).
- **Padding:** `p-4` (1rem).

### Inputs
- **Style:** 2px ink border, `bg-card` fill.
- **Focus:** 2px `ring` in primary green.
- **Label:** Above the field, `text-sm font-bold`.

### Navigation / Sidebar
- **Desktop:** 240px sidebar, cream card with 2px ink right border. Active nav pill: green fill + 2px ink border + offset shadow. Inactive nav pill: transparent, hover surfaces with mint tint.
- **Mobile:** Topbar with avatar + brand mark + drawer trigger. Drawer uses the Memphis sheet (2px border + offset shadow).

### Floating Action Button
- **Shape:** 56px circle, yellow accent fill (`bg-accent`), 2px ink border, 4px offset shadow.
- **Position:** Fixed bottom-right, 24px margin.

### Avatars
- **Procedural** (in `client/src/components/decor/Avatar.tsx`): circular head with two eyes and a smile. Two color variants: `mint` (default) and `cream`. Rendered next to the user block in the sidebar and on the landing page header.

## Do's and Don'ts

### Do
- Use `bg-card` for surfaces, `memphis-card` for the elevation pattern.
- Use `text-primary` for income, `text-destructive` for expense.
- Use `memphis-btn-shadow` on every interactive CTA.
- Use the `memphis` primitive shell from `client/src/components/memphis/` (the upstream `ui/` shell is kept untouched for sync).
- Use `cn()` from `lib/utils` for class composition.

### Don't
- Use `backdrop-filter: blur` or `glass-*` classes anywhere.
- Use `bg-gradient-*` or radial mesh backgrounds.
- Hardcode hex values — use `hsl(var(--...))` tokens.
- Add a corner radius larger than 16px.
- Edit `client/src/components/ui/` — fork into `memphis/` instead.
