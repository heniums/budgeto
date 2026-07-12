# Tech Stack: Budgeto

## Language
- **TypeScript** — Type-safe throughout (frontend and backend) for maintainability and fewer runtime errors.

## Frontend (PWA)
- **React** — Component-based UI, built as a Progressive Web App (installable on Android, responsive for web).
- PWA tooling (service worker + manifest) for offline-capable core views.

## Backend
- **Node.js + Express** — REST API serving the React PWA. Written in TypeScript.

## Database
- **PostgreSQL** — Reliable relational store for users, accounts, categories, transactions, and budgets. Accessed via an ORM/query layer (e.g., Prisma or Drizzle).

## Notes
- Single TypeScript codebase shared conventions across client and server.
- API-first design so the same backend can later support additional clients.
