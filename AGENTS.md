# AGENTS.md — Budgeto

Budgeto is a personal finance & budgeting PWA with a TypeScript monorepo: React client + Express API + PostgreSQL.

---

## Essential Commands

```bash
npm install                        # Install all dependencies
npm run dev                        # Start DB, server (tsx watch), client (Vite) concurrently
npm run db                         # Start embedded PostgreSQL + apply migrations (port 5433)
npm test                           # Run all tests (server then client)
npm run test:watch                 # Watch-mode tests (vitest)
npm run test:coverage              # Run tests with coverage
npm run type-check                 # `tsc --noEmit` full project type-check
npm run lint                       # ESLint on .ts/.tsx files
npm run lint:fix                   # ESLint with auto-fix
npm run format                     # Prettier on all source files
npm run build                      # Type-check + Vite production build
npx drizzle-kit generate           # Generate a migration from schema.ts changes
npx drizzle-kit migrate            # Apply migrations (normally done by `npm run db`)
```

All commands run from the repo root. The `CI=true` prefix is used in `npm test` to ensure single-run mode.

---

## Project Structure

```
budgeto/
  client/                  # React PWA (Vite)
    src/
      api/                 # Per-resource API modules (auth.ts, wallets.ts, categories.ts)
        client.ts          # Shared axios instance with JWT interceptor & ApiError class
      auth/                # AuthContext, ProtectedRoute
      components/          # Shared UI (Layout, Sidebar)
      pages/               # One component per route, colocated with *.test.tsx
      router.tsx           # Central route definitions
      styles.css           # Global CSS (no CSS modules or Tailwind)
    test/setup.ts          # @testing-library/jest-dom import
    vite.config.ts         # Vite + React plugin + PWA plugin
    vitest.config.ts       # jsdom env, client test glob pattern
  server/
    src/
      app.ts               # Express app factory (createApp)
      index.ts             # Server entry point (listen + graceful shutdown)
      config.ts            # Environment config with defaults, cached singleton
      errors.ts            # AppError factory (symbol-branded), factory fns per status
      db/
        client.ts          # pg Pool + Drizzle instance
        schema.ts          # Drizzle schema definitions + inferred types
      auth/                # Auth feature: router, controller, service, repository, token, password, middleware
      wallets/             # Wallets CRUD (same layered pattern)
      categories/          # Categories CRUD (same layered pattern)
      transactions/        # Transactions CRUD (same layered pattern)
    migrations/            # Drizzle SQL migrations (auto-numbered)
      meta/_journal.json   # Migration journal
    test/
      setup.ts             # Spins embedded-postgres on port 5434, creates test tables
      *.test.ts            # Integration tests using supertest + createApp()
  conductor/               # Project management docs (not application code)
    code_styleguides/      # general.md, typescript.md, react.md, sql.md
    product.md, product-guidelines.md, tech-stack.md, workflow.md
    tracks/                # Feature track plans & specs
  scripts/start-db.mts     # Embedded PostgreSQL launcher + migration runner
  drizzle.config.ts        # Drizzle Kit config
  vitest.config.ts         # Root vitest config (server tests)
  tsconfig.json            # Single tsconfig for both client and server
```

---

## Architecture & Data Flow

### Server: 4-layer pattern per feature module

```
router.ts     →  Express Router, binds paths to controller handlers, applies auth middleware
controller.ts →  Thin request/response layer: parses input with Zod, calls service, sends JSON
service.ts    →  Business logic: validates ownership, orchestrates repo calls, throws AppErrors
repository.ts →  Database queries using Drizzle ORM; pure data access, no business logic
```

**Key rules:**

- Routers import from controllers, controllers from services, services from repositories — never skip layers.
- All routes except `/health` and `/auth/register|login` are protected by `authenticate` middleware.
- `authenticate` middleware attaches `req.user` (`{ sub: string; email: string }`) after JWT verification.
- Controllers always wrap their body in `try { ... } catch (error) { next(error); }`.
- Services use Zod schemas for input validation (exported so controllers can call `.parse()`).
- Repositories re-export Drizzle-inferred types from `db/schema.ts`.

**Error handling chain:**

1. Repository throws or returns `undefined`
2. Service throws `AppError` (via `notFoundError()`, `conflictError()`, etc.)
3. Controller catches and calls `next(error)`
4. Central error handler in `app.ts` maps `ZodError` → 400, `AppError` → statusCode, others → 500

### Client: API-centric with context-based auth

```
api/*.ts         →  Typed functions wrapping apiClient (axios), return response.data
api/client.ts    →  Axios instance: baseURL from env, auto-attaches Bearer token, 401 event dispatch
auth/AuthContext  →  Provides user, status ('loading'|'authenticated'|'unauthenticated'), login, logout, refreshUser
pages/*.tsx      →  Page components: local state (useState + useEffect), call API functions directly
router.tsx       →  Flat route array, ProtectedRoute wraps authenticated routes under Layout > Outlet
```

**Key rules:**

- API modules export plain async functions (not hooks). Components call them directly.
- Token is stored in `localStorage` under key `budgeto:token`.
- On 401 response, axios interceptor dispatches `budgeto:unauthorized` custom event (not directly calling logout).
- Each page manages its own loading/error/data state with `useState` + `useEffect` with cleanup flag.
- Client tests mock API modules at the module level using `vi.mock()` with `importOriginal` passthrough.

### Database

- PostgreSQL via `embedded-postgres` (local dev, port 5433) and `pg` driver.
- Drizzle ORM for schema definition, query building, and migrations.
- **Schema changes REQUIRE a migration**: edit `server/src/db/schema.ts`, then run `npx drizzle-kit generate`. Never hand-edit the DB.
- Test setup independently creates tables (not via migrations) to stay self-contained on port 5434.
- Connection string comes from `DATABASE_URL` env var (`.env` file, gitignored). `.env.example` shows defaults.

---

## Conventions & Style

### TypeScript

- **Single quotes**, **semicolons always**, trailing commas.
- **Named exports only** — no `export default` except Express routers.
- **Type imports** enforced by ESLint (`@typescript-eslint/consistent-type-imports`).
- **No `any`**, no non-null assertions (`!`), no type assertions (`as`) without justification.
- Unused vars prefixed with `_` are allowed (e.g., `_req`, `_next`).
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.
- Prettier: 2-space indent, 80 char width.

### React

- Functional components with Hooks only.
- PascalCase for component files and function names.
- `JSX.Element` return type on all components.
- One component per file, colocated with its test file (`Foo.tsx` + `Foo.test.tsx`).

### Naming

- Files/dirs: lowercase with hyphens or camelCase following existing patterns.
- Server feature dirs: plural (`auth/`, `wallets/`, `categories/`).
- Functions: `lowerCamelCase`, descriptive verbs (`getUserById`, `deleteCategory`).
- Handlers: `createHandler`, `listHandler`, `getHandler`, `updateHandler`, `deleteHandler`.

### API Design

- RESTful: `POST /resource`, `GET /resource`, `GET /resource/:id`, `PUT /resource/:id`, `DELETE /resource/:id`.
- Response envelopes: collections use `{ items: [...] }` (e.g., `{ categories: [...] }`, `{ wallets: [...] }`).
- Error responses: `{ code: string, message: string }` plus optional `details[]` for validation.

---

## Testing

### Server tests (`server/test/*.test.ts`)

- vitest with globals enabled, node environment, sequential execution (`fileParallelism: false`).
- `globalSetup` spins up embedded-postgres on port 5434, creates tables via raw SQL.
- Tests use `supertest` against `createApp()` (no real HTTP server needed).
- Each test file manages its own data cleanup in `beforeEach` (e.g., `deleteAllUsers()`).
- Coverage thresholds: 80% lines, functions, branches, statements.

### Client tests (`client/src/**/*.test.tsx`)

- vitest with globals enabled, jsdom environment.
- Setup imports `@testing-library/jest-dom/vitest` for DOM matchers.
- Mock API modules with `vi.mock('../api/foo', ...)` using `importOriginal` passthrough.
- Wrap components in `MemoryRouter` + `AuthProvider` for routing/auth context.
- Use `@testing-library/react` (`render`, `screen`, `waitFor`) and `@testing-library/user-event`.
- Always call `cleanup()` in `beforeEach` and `vi.clearAllMocks()`.

---

## Gotchas & Non-Obvious Patterns

1. **Embedded PostgreSQL is not Docker** — the `embedded-postgres` npm package downloads a real PostgreSQL binary. The first run takes time. Data dirs are `.pgdata/` (dev) and `.pgdata-test/` (test), both gitignored.

2. **Test DB is separate** — Tests use port 5434, not 5433. Test setup creates tables directly via SQL (not Drizzle migrations), so `server/test/setup.ts` must be kept in sync with `schema.ts` when tables/columns change.

3. **Config is cached** — `getConfig()` reads env vars once and caches the result. Tests that need different config values must clear the cache (or set env vars before the first call).

4. **The `importOriginal` pattern in mocks** — Client tests that mock API modules use `vi.mock('../api/auth', async (importOriginal) => { const actual = await importOriginal<typeof AuthModule>(); return { ...actual, getMe: vi.fn() }; })`. This pattern ensures un-mocked exports still work.

5. **App factory, not singleton** — `createApp()` returns a new Express instance each call. Tests call it directly; the production entry point (`index.ts`) calls it once. This keeps tests isolated.

6. **No database-level user isolation in tests** — Test cleanup uses `deleteAllUsers()` which cascades (or manually cleans up) related data. Repository modules export cleanup functions for test use.

7. **Sidebar fetches its own data** — The `Sidebar` component independently calls `getWallets()` on mount and on pathname change. It does not receive wallets as props.

8. **Auth flow: event-driven logout** — The 401 interceptor dispatches a `budgeto:unauthorized` custom event. The `AuthProvider` listens for this event (via `useEffect`) and calls `logout()`. Components don't directly listen for this event.

9. **Migration filenames are auto-generated** — Drizzle Kit generates names like `0001_cynical_guardsmen.sql`. Don't rename them. The journal tracks their order.

10. **`type` field in `categories` table** — Stored as freeform text (`text`), validated at the application layer by Zod as `z.enum(['income', 'expense'])`. No database-level CHECK constraint.

11. **No CSS modules / Tailwind** — The project uses a single global `styles.css` with class-based selectors. No CSS-in-JS or utility framework.
