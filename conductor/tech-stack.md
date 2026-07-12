# Tech Stack: Budgeto

## Language
- **TypeScript** — Type-safe throughout (frontend and backend) for maintainability and fewer runtime errors.

## Frontend (PWA)
- **React** — Component-based UI, built as a Progressive Web App (installable on Android, responsive for web).
- PWA tooling (service worker + manifest) for offline-capable core views.

## Backend
- **Node.js + Express** — REST API serving the React PWA. Written in TypeScript.

## Database
- **PostgreSQL** — Reliable relational store for users, accounts, categories, transactions, and budgets, accessed with the **`pg`** driver through the **Drizzle ORM** (`drizzle-orm/node-postgres`).
- **Neon** — Managed/serverless PostgreSQL is the target database provider. Because Neon is wire-compatible with PostgreSQL and the app connects via the standard `pg` driver using `DATABASE_URL`, the same code runs locally (embedded PostgreSQL) and in production (Neon) without changes.

## Local Development Database (Deviations)

> **Dated note (2026-07-12):** The target environment for this implementation cannot
> provision a PostgreSQL server (no root/`sudo` access, no Docker available). To remain
> faithful to the "PostgreSQL" decision while keeping the project runnable and testable,
> the **`embedded-postgres`** package is used to download and launch a real PostgreSQL
> binary as the current (non-root) user for local development and automated tests.
> The application connects with the standard **`pg`** driver via `DATABASE_URL`, so the
> same code runs against the local embedded instance and against **Neon** in production.

## Notes
- Single TypeScript codebase shared conventions across client and server.
- API-first design so the same backend can later support additional clients.
