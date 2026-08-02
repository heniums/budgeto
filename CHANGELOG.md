# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.3.0] — 2026-08-02

### Added

**Authentication & Accounts**

- Refresh token authentication with silent renewal via httpOnly cookies
- Secure cookie-based sessions — tokens no longer stored in `localStorage`
- Automatic session refresh — expired access tokens silently renewed via `POST /auth/refresh` with request retry
- Refresh token rotation with revoke-on-password-change and idempotent logout
- Access token lifetime shortened to 15 minutes; refresh tokens valid for 7 days
- New `refresh_tokens` database table for server-side token storage

**Dashboard & Analytics**

- Interactive dashboard with 12 configurable widgets (income trends, expense breakdown, category spending, budget progress, recent transactions)
- Drag-and-drop sortable grid layout with per-widget column/row spans
- Widget visibility settings — show/hide individual widgets
- Dashboard data provider with real-time summary statistics from server endpoints
- Work in Progress badge on Home page indicating ongoing development

**Transactions**

- Time-of-day support in transaction dates (displayed as M/D/YYYY h:mm A)
- Income/expense toggle buttons in transaction form (amount input always positive, sign applied at submit)
- Incremental list updates after create/edit/delete (no full refetch needed)
- Filter-aware insertion — new transactions only appear if they match active filters

**Wallet & Category Selection**

- Horizontal overflow scrolling for long wallet/category lists
- Sticky "More" button that opens fuzzy-search popup for easier selection
- FuzzyItemPicker reusable component for searchable item selection across the app
- Right-edge gradient fade to indicate more content available

**User Settings**

- Extended auth context with `updateSettings()` for user profile management
- User settings table in database for widget preferences and dashboard configuration

**Database**

- Foreign key indexes on wallets.user_id, categories.user_id, transactions.wallet_id, transactions.category_id
- Resolved category.type drift issue (type now derived from transaction amount sign)
- User settings and widgets tables for dashboard customization

### Changed

- Authentication profile update endpoint renamed from `updateUserName` to `updateUserProfile` for broader field support
- Vercel deployment domain updated to budgeto.heniums.vercel.app

### Fixed

- Popover dismissal race condition in searchable picker (use onMouseDown with preventDefault)
- Dashboard grid drag overlay using pixel dimensions instead of CSS grid spans
- Migration journal timestamp corrections
- Code review issues across multiple PRs (#37, #39, #41, #42)

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

[Unreleased]: https://github.com/heniums/budgeto/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/heniums/budgeto/releases/tag/v1.3.0
[1.0.0]: https://github.com/heniums/budgeto/releases/tag/v1.0.0
