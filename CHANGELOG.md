# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.0] — 2026-07-26

### Added

**Authentication & accounts**

- Sign up and sign in with JWT session persistence in `localStorage`
- Profile management — edit display name, change password
- Protected route guard with redirect and return-url preservation
- Guest route guard for public pages (landing, sign in, sign up)
- Auth-aware landing page header — shows user name and sign-out when logged in
- Session resilience — preserves login on transient `getMe` failures

**Wallets**

- Multi-wallet CRUD with name, currency, and optional notes
- Per-wallet currency selection from 150+ ISO 4217 codes
- Default currency auto-detected from browser locale
- Currency formatting via `Intl.NumberFormat` with per-wallet locale
- Balance adjustment — atomic, row-locked transaction with audit trail
- Initial balance field on wallet create and edit forms
- Computed balances via `SUM(transactions.amount)` — no denormalized state

**Categories**

- Category CRUD with custom hex colors
- Implicit type detection from transaction amount sign (positive = income, negative = expense)
- Category deletion sets transactions to `null` (preserves history)

**Transactions**

- Transaction CRUD with signed amounts
- Wallet-to-wallet transfers — paired withdrawal + deposit in a single DB transaction
- Server-side filtering by wallet, category, date range, and text search
- Date range presets (this week, this month, last month, this year, custom)
- Infinite scroll with `IntersectionObserver`
- Transaction detail dialog with edit and delete actions

**Budgets**

- Multi-category budgets with per-category spending limits
- Monthly and custom date-range period support
- Period navigation (previous / next / today)
- Progress bars showing spent vs. limit per category
- Over-budget visual indicators

**UI/UX**

- React 18 SPA with React Router and anchor-based navigation
- Tailwind CSS + shadcn/ui component library (Button, Dialog, Form, Table, Tabs, etc.)
- PWA support — installable, offline-capable, auto-update via Workbox
- Top-level tab navigation: Home, Budgets, Settings (Wallets / Categories / User)
- Onboarding wizard for first-time users (dismissable, stored in `localStorage`)
- Chip selectors for wallet and category in transaction forms
- Row-click modals for inline wallet and category editing
- Skeleton loading UI for all data-driven pages
- Form validation with `react-hook-form` + Zod schemas
- Microcopy and placeholder text across all form inputs
- Accessible — ARIA labels, keyboard navigation, Enter-to-submit

**Infrastructure**

- TypeScript monorepo — React client, Express API server, PostgreSQL
- Drizzle ORM with typed schema and generated SQL migrations
- Layered server architecture: router → controller → service → repository
- Ownership enforcement on every resource mutation (404 for unauthorized access)
- Domain error system with branded `AppError` and central handler
- 400+ tests — server integration (supertest + embedded PostgreSQL) and client components (Testing Library + jsdom)
- 80% coverage thresholds enforced via Vitest
- Vercel deployment (frontend) + Neon PostgreSQL (database)
- Embedded PostgreSQL for local development (`npm run db`)
- ESLint flat config with strict TypeScript rules (no `any`, no non-null assertions)
- Prettier formatting (single quotes, semicolons, trailing commas)

---

[Unreleased]: https://github.com/heniums/budgeto/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/heniums/budgeto/releases/tag/v1.0.0
