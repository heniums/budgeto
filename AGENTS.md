# Budgeto — AI Agents

Read `CONVENTIONS.md` before any git operation.

<!-- BEGIN bigpowers:project -->

## Project

Personal finance & budgeting PWA. TypeScript monorepo: React client, Express API, PostgreSQL database.

## Stack

| Layer    | Tech                                                 |
| -------- | ---------------------------------------------------- |
| Client   | React 18, Vite, Tailwind CSS, shadcn/ui, TypeScript  |
| Server   | Express, Node.js 22, TypeScript                      |
| ORM      | Drizzle ORM + Drizzle Kit                            |
| Database | PostgreSQL (embedded-postgres for dev/test)          |
| Tests    | vitest, supertest (server), Testing Library (client) |

## Commands

| Action     | Command                                     |
| ---------- | ------------------------------------------- |
| Run        | `npm run dev`                               |
| Test       | `npm test`                                  |
| Build      | `npm run build`                             |
| Lint       | `npm run lint`                              |
| Preflight  | `npm test && npm run lint && npm run build` |
| DB         | `npm run db`                                |
| Type check | `npm run type-check`                        |
| CI         | `gh pr checks` (when a PR is open)          |

## Architecture

Server features follow a 4-layer pattern: `router` binds paths to `controller` handlers; `controller` parses input with Zod and calls `service`; `service` enforces business rules and ownership; `repository` executes Drizzle queries. Client uses API modules wrapping an axios instance with JWT interceptor, plus `AuthContext` for auth state. Pages manage their own state and call API functions directly.

## Conventions

- Single quotes, semicolons, trailing commas.
- Named exports only; `export default` allowed only for Express routers.
- Type imports enforced (`@typescript-eslint/consistent-type-imports`).
- No `any`, no non-null assertions, no type assertions without justification.
- Server feature dirs plural (`auth/`, `wallets/`, `categories/`, `transactions/`).
- Handlers named: `createHandler`, `listHandler`, `getHandler`, `updateHandler`, `deleteHandler`.
- RESTful routes with `{ resource: [...] }` collection envelopes.
- Schema changes require a Drizzle migration (`npx drizzle-kit generate`). Never hand-edit the DB.

## Never

- Never skip tests to move faster.
- Never hand-edit the database schema; always generate a migration.
- Never dismiss reproducible gate failures as pre-existing or out of scope.
- Never proceed on red Preflight or red CI — invoke `quick-fix` or `fix-bug` first.
- Never reuse database IDs across unrelated tables or bypass ownership checks in services.
- Never commit `.env` files or embedded-postgres data directories.

## Agent Rules

- **Workflow Mandate:** You MUST use the bigpowers skills (e.g., `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- **Always Green:** Preflight and CI must be green before forward work. Reproducible gate failures require fix-or-log (`quick-fix` → `fix-bug`) per `CONVENTIONS.md` § Discovered Defects.
- Read `specs/` before writing code.
- All planning and specifications MUST be written to `specs/` (`product/SCOPE_LATEST.yaml`, `release-plan.yaml`, `epics/`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.

<!-- END bigpowers:project -->

<!-- BEGIN bigpowers:context-routing -->

## Context Routing

| Path glob      | Sub-AGENTS.md                          |
| -------------- | -------------------------------------- |
| `server/**`    | `AGENTS.md` (server conventions above) |
| `client/**`    | `AGENTS.md` (client conventions above) |
| `conductor/**` | `AGENTS.md` (project docs)             |

<!-- END bigpowers:context-routing -->

<!-- BEGIN bigpowers:learned-preferences -->

## Learned User Preferences

- Workflow mode: `solo-git` (ship via `land-branch.sh`, no PR ceremony).

## Workspace Facts

- Embedded PostgreSQL runs on port 5433 (dev) and 5434 (test).
- Git default branch is `main`.

<!-- END bigpowers:learned-preferences -->
