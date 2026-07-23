# Repository Guidelines

## Project Overview

Budgeto is a personal finance & budgeting Progressive Web App (PWA). It supports multi-wallet tracking, categorized transactions, budget management with per-category limits, wallet-to-wallet transfers, and balance adjustments with audit trails. TypeScript monorepo: React 18 client, Express API server, PostgreSQL database.

## Architecture & Data Flow

### Request flow (server)
```
HTTP → Express middleware → router (mounts handlers + auth)
  → controller (Zod parse, response shaping, error forwarding)
  → service (business logic, ownership checks, cross-feature calls)
  → repository (Drizzle ORM queries)
  → JSON response
```

### Server layer pattern
Every feature directory under `server/src/` follows a strict 4-layer convention:

| File | Responsibility |
|---|---|
| `router.ts` | Express `Router`, attaches `authenticate` middleware, maps paths to controller handlers |
| `controller.ts` | HTTP concerns: parses body/params/query with Zod, calls service, shapes JSON response, `try/catch` forwarding errors to `next()` |
| `service.ts` | Business logic: exports Zod schemas, enforces ownership (`resource.userId !== userId` → `notFoundError`), domain rules, cross-feature calls |
| `repository.ts` | Data access: Drizzle ORM queries, dynamic WHERE builders, DB transactions with `FOR UPDATE` locks |

**Features**: `auth/`, `wallets/`, `categories/`, `budgets/`, `transactions/` — all plural, all authenticated (except `/auth/register` and `/auth/login`).

### Client architecture
```
main.tsx → AuthProvider (Context) → App → RouterProvider
  → public routes: Landing (/), SignIn (/login), SignUp (/signup)
  → protected routes (ProtectedRoute guard): Layout > Dashboard, Budgets, Settings (tabs: Wallets, Categories, User)
```

- **State management**: React Context for auth only (`AuthContext`). Feature state is local (`useState`/`useEffect`). Data fetched fresh from API on mount — no global store.
- **Auth flow**: JWT stored in `localStorage` key `budgeto:token`. `AuthProvider` calls `getMe()` on mount to validate. `ProtectedRoute` redirects to `/login` preserving `location.state.from`. 401 responses dispatch `budgeto:unauthorized` `CustomEvent`.
- **API layer**: One axios instance (`client/src/api/client.ts`). Request interceptor injects `Bearer` token. Response interceptor wraps errors in `ApiError` class. One module per resource domain.

### Database schema (PostgreSQL via Drizzle ORM)
6 tables: `users`, `wallets` (FK→users), `transactions` (FK→wallets CASCADE, FK→categories SET NULL), `categories` (FK→users), `budgets` (FK→users CASCADE), `budget_categories` (FK→budgets CASCADE, FK→categories CASCADE, UNIQUE on budget_id+category_id). All PKs are UUIDs. Wallet balance is computed on-the-fly via `SUM(transactions.amount)` — no denormalized balance column.

### Key domain concepts
- **Transactions** use signed amounts (positive = income, negative = expense). Category type is implicit from amount sign.
- **Transfers** create paired withdrawal+deposit in a single DB transaction. Source and target must differ.
- **Balance adjustment** creates an audit-trail transaction against an auto-created per-user "Balance Adjustment" category, using `SELECT ... FOR UPDATE` row lock.
- **Budgets** group multiple categories with per-category limits. Periods (monthly/custom) computed on-the-fly via `dayjs`, not stored.
- **Ownership**: every resource mutation checks `resource.userId === req.user.sub`. Mismatch returns 404 (never 403) to avoid leaking existence.

## Key Directories

| Directory | Purpose |
|---|---|
| `server/src/` | Express API: feature dirs (`auth/`, `wallets/`, `categories/`, `budgets/`, `transactions/`) + `db/` (schema, client) + shared (`app.ts`, `config.ts`, `errors.ts`, `health.ts`) |
| `server/migrations/` | Drizzle-generated SQL migrations (do not hand-edit) |
| `server/test/` | Server integration tests (supertest + embedded PostgreSQL) |
| `client/src/` | React SPA: `pages/`, `components/`, `api/`, `auth/`, `lib/`, `hooks/` |
| `client/src/components/ui/` | shadcn/ui primitives (Button, Input, Dialog, Table, etc.) |
| `client/test/` | Client test setup (`setup.ts`) |
| `scripts/` | Dev orchestration (`dev.mts`), embedded PostgreSQL launcher (`start-db.mts`) |
| `specs/` | Product specs, epics, architecture, verifications, security reviews |

## Development Commands

| Action | Command |
|---|---|
| Run (full stack) | `npm run dev` |
| Run (server only) | `npm run dev:server` |
| Run (client only) | `npm run dev:client` |
| Test (all) | `npm test` |
| Test (watch) | `npm run test:watch` |
| Test (coverage) | `npm run test:coverage` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Lint (fix) | `npm run lint:fix` |
| Format | `npm run format` |
| Type check | `npm run type-check` |
| DB (embedded) | `npm run db` |
| DB migrate | `npm run db:migrate` |
| Generate migration | `npx drizzle-kit generate` |
| Preflight gate | `npm test && npm run lint && npm run build` |
| CI | `gh pr checks` |

`npm run dev` uses `concurrently` to run server (`tsx watch`), client (`vite`), and optionally embedded PostgreSQL (`scripts/start-db.mts` with `--lcdb` flag).

## Code Conventions & Common Patterns

### Formatting (Prettier + ESLint)
- **Single quotes**, **semicolons**, **trailing commas** (always), `printWidth: 80`, `tabWidth: 2`
- **Named exports only**; `export default` allowed only for Express routers
- **Type imports enforced** (`@typescript-eslint/consistent-type-imports`)
- **No `any`**, no non-null assertions (`!`), no type assertions without justification — ESLint flat config blocks them
- Test files have relaxed rules (any/non-null allowed)

### Naming conventions
- Server feature dirs: **plural** (`wallets/`, `categories/`, `budgets/`, `transactions/`)
- Controller handlers: `createHandler`, `listHandler`, `getHandler`, `updateHandler`, `deleteHandler`
- Zod schemas per feature: `createWalletSchema`, `updateWalletSchema`, etc., exported from `service.ts`
- Repository functions: `findXxx`, `createXxx`, `updateXxx`, `deleteXxx`, `deleteAllXxx`
- Client API module files: named after resource (`wallets.ts`, `categories.ts`, `budgets.ts`, `transactions.ts`, `auth.ts`)

### Error handling (server)
- Use `createError(status, code, message, details?)` from `server/src/errors.ts`
- Branded with a `Symbol` tag (`budgeto.appError`) — central handler in `app.ts` matches via `isAppError()`
- Convenience factories: `validationError()`, `conflictError()`, `unauthorizedError()`, `notFoundError()`
- Zod validation failures → caught in `app.ts` → 400 with field-level `details`
- Unknown errors → 500 with generic message (no leak)

### API response envelope
```
{ "resource": [ ... ] }       // for collections
{ "resource": { ... } }       // for single items (some endpoints)
```
Consistent status codes: 201 (create), 200 (read/update), 204 (delete, change-password), 400 (validation), 401 (auth), 404 (not found / not owned), 409 (conflict).

### Server patterns
- Config loaded once via cached singleton (`server/src/config.ts`)
- DB client: `pg.Pool` + `drizzle()` with full schema object (`server/src/db/client.ts`)
- Graceful shutdown: `pool.end()` on SIGINT/SIGTERM
- JWT middleware: extends `Express.Request` with `user: TokenPayload`. `authenticate()` verifies Bearer token; `getUser()` is a type-narrowing helper

### Client patterns
- Forms: `react-hook-form` + `@hookform/resolvers/zod` for type-safe validation
- Error display: `FormError`/`FormAlert` components
- ClassName composition: `cn()` from `lib/utils.ts` combining `clsx` + `tailwind-merge`
- UI primitives: shadcn/ui components in `client/src/components/ui/` (never hand-rolled)
- Icons: `lucide-react` via `lib/icons.ts` registry (25 icons)
- Currency: `lib/currencies.ts` (150+ ISO 4217 codes, `Intl.NumberFormat` formatting)
- Date ranges: `lib/dateRange.ts` (presets, period key, human labels, Monday-anchored weeks)
- Transfers: `lib/transferPair.ts` (detect paired opposite-sign transactions within 2s window)
- Custom hooks in `client/src/hooks/` (e.g., `use-long-press.ts` for context menus)

## Important Files

### Entry points
| File | Role |
|---|---|
| `server/src/index.ts` | Server entry: creates app, listens, graceful shutdown |
| `server/src/app.ts` | Express app factory: CORS, JSON, routers, error handler |
| `client/src/main.tsx` | Client entry: `createRoot`, `AuthProvider` |
| `client/src/App.tsx` | Creates router from route definitions |
| `client/index.html` | Vite HTML template |

### Config files
| File | Role |
|---|---|
| `tsconfig.json` | Root: ES2022, Bundler resolution, strict, `@server/*` and `@/*` paths, `noEmit` |
| `client/tsconfig.json` | Client: `vite/client` types, `@/*` alias |
| `client/vite.config.ts` | Vite: React + PWA plugins, port 5173, `@` alias |
| `eslint.config.mjs` | Flat ESLint: TypeScript strict rules, test overrides |
| `.prettierrc.json` | Formatting rules |
| `drizzle.config.ts` | Drizzle Kit: PostgreSQL, schema path, migrations dir |
| `client/tailwind.config.cjs` | Tailwind + shadcn/ui CSS variable system |
| `client/components.json` | shadcn/ui configuration |
| `vitest.config.ts` | Root (server) test config: node env, globalSetup, 80% coverage |
| `client/vitest.config.ts` | Client test config: jsdom env, `@` alias, setup file |
| `.env.example` | Template for `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV` |

### Key modules
| File | Role |
|---|---|
| `server/src/db/schema.ts` | All Drizzle table definitions + relations |
| `server/src/db/client.ts` | pg Pool + drizzle instance |
| `server/src/errors.ts` | Domain error factory (`AppError` with Symbol tag) |
| `server/src/config.ts` | Cached env config singleton |
| `server/src/auth/middleware.ts` | JWT Bearer `authenticate` middleware |
| `client/src/api/client.ts` | Axios instance with JWT interceptor + `ApiError` |
| `client/src/auth/AuthContext.tsx` | Auth state + `useAuth()` hook |
| `client/src/router.tsx` | Route definitions |
| `client/src/lib/utils.ts` | `cn()` utility |

## Runtime/Tooling Preferences

| Concern | Choice |
|---|---|
| Runtime | **Node.js 22** (not Bun) |
| Package manager | **npm** |
| TypeScript | 5.5, strict mode, `noEmit` (server runs via `tsx`, client bundled by Vite) |
| Module system | ESM (`"type": "module"`) |
| TS paths | `@server/*` → `server/src/*`, `@/*` → `client/src/*` |
| Dev runner | `tsx watch` (server), `vite` (client), `concurrently` (both) |
| Database (dev) | Neon.tech cloud PostgreSQL (`.env`) or embedded PostgreSQL on port 5433 (`--lcdb` flag) |
| Database (test) | embedded-postgres on port 5434 (auto-managed by Vitest globalSetup) |
| Migrations | Drizzle Kit — **never hand-edit SQL migrations or the DB directly** |
| PWA | `vite-plugin-pwa` with Workbox, auto-update, standalone manifest |

## Testing & QA

### Frameworks
- **Vitest 2.0** with two separate projects: root config (server) and `client/vitest.config.ts` (client)
- **supertest** for HTTP-level server integration tests
- **@testing-library/react** + **@testing-library/user-event** for client component tests
- **@testing-library/jest-dom** for DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- **v8** coverage provider with 80% thresholds (branches, functions, lines, statements)

### Test execution
```
npm test
# Runs: CI=true vitest run && CI=true vitest run --config client/vitest.config.ts
# Server first (~187 tests), then client (~222 tests)
```

### Server tests (`server/test/`)
- **Full integration**: real embedded PostgreSQL booted by `globalSetup` (`server/test/setup.ts`), Drizzle migrations applied
- **Pattern**: `beforeEach` cleans relevant tables via `deleteAll*` repository helpers → register test user → get JWT token via `signToken()` → exercise endpoint via `supertest(request(app))`
- **Covers**: CRUD for every resource, auth enforcement (401/404), validation errors (400), ownership isolation, filtering/pagination, balance computation, adjustment atomicity, transfer logic
- Tests colocate with source when testing non-HTTP layers: `server/src/**/auth.service.test.ts`, `auth.repository.test.ts`

### Client tests (`client/src/**/*.test.{ts,tsx}`)
- **jsdom** environment, `@testing-library/jest-dom/vitest` matchers, `ResizeObserver` stub in setup
- **API mocking pattern**: `vi.hoisted()` creates mock fns → `vi.mock('./client')` returns mocked `apiClient` + `ApiError` → each test asserts HTTP method/path and data flow
- **Component mocking**: `vi.mock` on API modules (not client directly), often using `async importOriginal` to preserve unimplemented exports
- **Rendering**: `render()` from `@testing-library/react`, interactions via `userEvent.setup()`
- **Common mocks**: `IntersectionObserver` (infinite scroll), `window.confirm` (delete confirmations), `localStorage` (auth tokens, onboarding dismissal)
- **Covers**: pages, components, API modules, auth context, route guards, utility functions, accessibility (labels, Enter submission, auto-focus), microcopy

### Quality gates
- **Preflight** (`npm test && npm run lint && npm run build`) must pass before any forward work
- CI green required before merge. Use `gh pr checks` when a PR is open.
- Never dismiss reproducible gate failures — use `quick-fix` or `fix-bug` ladder per `CONVENTIONS.md`
- Schema changes require a generated migration (`npx drizzle-kit generate`) — **never hand-edit SQL or the DB**
