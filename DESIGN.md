---
name: Budgeto
description: Personal finance PWA with glassmorphic dark-mode dashboard
colors:
  primary: "hsl(160 84% 39%)"
  primary-foreground: "hsl(210 40% 98%)"
  background: "hsl(222 47% 4%)"
  foreground: "hsl(210 40% 98%)"
  card: "hsl(222 47% 8%)"
  card-foreground: "hsl(210 40% 98%)"
  secondary: "hsl(217 33% 17%)"
  secondary-foreground: "hsl(210 40% 98%)"
  muted: "hsl(217 33% 17%)"
  muted-foreground: "hsl(215 20% 65%)"
  accent: "hsl(217 33% 17%)"
  accent-foreground: "hsl(210 40% 98%)"
  destructive: "hsl(0 84% 60%)"
  destructive-foreground: "hsl(210 40% 98%)"
  border: "hsl(215 28% 25%)"
  input: "hsl(215 28% 25%)"
  ring: "hsl(160 84% 39%)"
  glass-bg: "hsl(222 47% 8%)"
  glass-blur: "16px"
  glass-opacity: "0.65"
  glass-border-opacity: "0.08"
  light-background: "hsl(0 0% 100%)"
  light-foreground: "hsl(150 20% 12%)"
  light-primary: "hsl(150 69% 32%)"
  light-glass-blur: "24px"
typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "calc(0.75rem - 4px)"
  md: "calc(0.75rem - 2px)"
  lg: "0.75rem"
  pill: "9999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
---

# Design System: Budgeto

## Overview

**Creative North Star: "The Obsidian Vault"**

A precision finance dashboard that feels like a private terminal — deep, dark, and deliberate. Every surface earns its place. The UI recedes so the numbers lead. Glass elements float above the background with soft luminosity, suggesting depth without decoration. This is not a toy; it is a tool that respects the user's attention.

**Key Characteristics:**
- Deep dark-mode default (near-black blue-black) with emerald accent
- Translucent glass panels float over the background with `backdrop-filter: blur()`
- shadcn/ui primitives, customized with CSS variable tokens
- System font stack; no custom fonts loaded
- Generous card padding, tight sidebar, clear visual hierarchy
- Two-theme support: dark (default) and light, toggled via `.light` class on `<html>`

## Colors

Emerald green drives brand recognition on a near-black canvas. No gradients on large areas.

### Primary
- **Emerald Accent** (`hsl(160 84% 39%)`): CTAs, active states, ring focus, wallet balance highlights, budget progress fill.

### Secondary
- **Deep Slate** (`hsl(217 33% 17%)`): Secondary buttons, muted surfaces, sidebar background in light mode.

### Neutral
- **Void Background** (`hsl(222 47% 4%)`): Page background (dark mode). Never used as a card fill directly — `card` provides tonal lift.
- **Card Surface** (`hsl(222 47% 8%)`): Card and glass panel fill, `2×` tonal lift above background.
- **Border / Input Stroke** (`hsl(215 28% 25%)`): 25% lightness — visible but not loud. Used on card borders, inputs, dividers.
- **Muted Text** (`hsl(215 20% 65%)`): Labels, secondary copy, placeholders. Contrast against card surface ≈ 7:1.

### Semantic
- **Destructive** (`hsl(0 84% 60%)`): Delete actions, error states. Light red — alarm without panic.
- **Destructive Foreground** (`hsl(210 40% 98%)`): Text on destructive backgrounds.

### Glass Tokens (light mode override)
- **Glass Background** (`hsl(0 0% 100%)` / 75% opacity): Light mode glass panels.
- **Glass Blur** (`24px`): Light mode is brighter, so blur must be stronger to read as translucent.
- **Glass Border** (`hsl(150 12% 82%)` / 50% opacity): Light surface border for glass panels in light mode.

## Typography

**Font Stack:** `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

No custom fonts. System stack ensures zero load time and native feel on each platform.

**Character:** Neutral, confident, legible. No personality flourishes — the numbers and data are the content.

### Hierarchy
- **Display** (700, clamp 1.875–2.25rem / 1.2): Page headings, dashboard total balance.
- **Title** (600, 1rem / 1.4): Card titles, section labels.
- **Body** (400, 0.875rem / 1.5): Form labels, descriptions, table content.
- **Label** (500, 0.75rem, -0.01em): Badges, sidebar items, field hints.

## Layout

- **App Shell:** Fixed left sidebar (240px desktop) + scrollable main content area. Sidebar collapses to bottom tab bar on mobile (< 640px).
- **Dashboard Grid:** CSS Grid with `useGridColumns` hook, responsive column count based on viewport.
- **Cards:** 1rem internal padding, 0.75rem border-radius, `hsl(var(--card))` fill, 1px `border` stroke.
- **Auth Pages:** Centered card on gradient-mesh background, max-width 400px.

## Elevation & Depth

**Philosophy: Tonal layering with translucent glass panels.** Surfaces lift via color lightness (`card` vs `background`), not shadow. Glass panels add a second elevation layer via `backdrop-filter: blur()`.

### Shadow Vocabulary
None in the current system. Depth is purely tonal.

### Glass Utility
```css
.glass {
  background-color: hsla(var(--glass-bg) / var(--glass-opacity));
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
}
/* Border is implicit: a 1px inset lighter edge on cards, not a separate glass-border token */
```

### Light Mode Glass
`.light` class on `<html>` overrides `--glass-bg` to white, increases blur to 24px, and sets `--glass-border` to a warm gray at 50% opacity.

## Shapes

- **Card radius:** `0.75rem` (12px). Consistent across all card surfaces.
- **Button radius:** `0.75rem` via `rounded-md` (same card radius).
- **Input radius:** `0.75rem` via `rounded-md`.
- **Badge / Pill radius:** `9999px` via `rounded-full`.
- **No geometric decoration.** No corner cuts, no angled edges, no border gradients.

## Components

### Buttons
- **Shape:** `rounded-md` (12px), same as card corners.
- **Primary:** `bg-primary` (`hsl(160 84% 39%)`), `text-primary-foreground`. Hover: `bg-primary/90`. Active: press effect via `active:scale-[0.98]`.
- **Ghost:** Transparent bg, `hover:bg-accent`. Used for secondary actions.
- **Destructive:** `bg-destructive` for delete actions.
- **States:** Hover, active (scale press), disabled (opacity 50%, no pointer), loading (spinner icon replaces text/icon).

### Cards / Containers
- **Corner Style:** `rounded-lg` (12px).
- **Background:** `hsl(var(--card))`.
- **Border:** 1px `hsl(var(--border))` stroke. Subtle but visible against the background.
- **Padding:** `p-4` (1rem).
- **Hover:** Dashboard cards lift border to `--color-primary` on hover — the only interactive affordance on cards.

### Inputs
- **Style:** 1px border stroke (`hsl(var(--input))`), transparent bg on dark, white bg on light.
- **Focus:** 2px `ring` in primary color (`hsl(var(--ring))`).
- **Error:** `border-color: var(--color-error)` (red stroke).
- **Label:** Above the field, `text-sm font-medium`.

### Navigation / Sidebar
- **Desktop:** Fixed 240px sidebar, `--color-secondary` tinted background.
- **Sidebar Items:** `text-sm`, `px-3 py-2`, full-width, rounded-md. Hover: `bg-accent`. Active: `bg-accent` + left accent border (3px emerald).
- **Mobile:** Bottom tab bar with icon + label, 5 tabs max.

### Badges
- **Style:** `rounded-full` pill, `text-xs font-medium`, padding `0.25rem 0.75rem`.
- **Colors:** Muted (secondary bg), primary (primary bg), destructive (destructive bg).

## Do's and Don'ts

### Do:
- **Do** use the glass utility (`.glass`) on overlay panels, dialogs, and floating surfaces to suggest depth.
- **Do** use `hsl(var(--...))` CSS variables for all color tokens — never hardcode hex values in components.
- **Do** use `cn()` (`lib/utils.ts`) for class composition to respect the tailwind/shadcn token system.
- **Do** use the `ring-2 ring-ring` pattern for focus-visible states on all interactive elements.
- **Do** use the `light` class toggle to switch between dark and light themes.

### Don't:
- **Don't** use `box-shadow` for elevation — use tonal lift via the `card` / `muted` / `secondary` token values.
- **Don't** add `border-radius` larger than 12px anywhere. The radius is consistent across all components.
- **Don't** use more than one font family. The system stack is the spec.
- **Don't** use gradient backgrounds on cards or auth pages (gradient-mesh is reserved for the landing page hero only).
- **Don't** hardcode colors in component files — every color must reference a CSS variable token.
- **Don't** add decorative borders, corner cuts, or angled edges.
