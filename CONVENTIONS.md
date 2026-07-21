# Budgeto — Conventions

All AI agents working on this project follow these rules. Read `AGENTS.md` for project context first.

## Always Green / Shift Left

Fix issues as early as possible. Running the Preflight command (`npm test && npm run lint && npm run build`) is the minimum local gate before any forward work or handoff. A red Preflight blocks progress. CI green is required before merging or releasing.

## Discovered Defects

If a red gate reveals a bug not introduced by the current change, you must either fix it or log it — never dismiss it. Follow the fix-or-log ladder:

1. **quick-fix** — trivial, safe fix that doesn't derail the current task. Make it in a separate commit.
2. **fix-bug** — non-trivial defect. Stop current work, branch, fix, and return to the original task after the fix is merged.

Separate commits for discovered fixes. Mention the discovered defect in the task handoff.

## Banned Dismissive Phrases

| Phrase                      | Why it is banned                                                     |
| --------------------------- | -------------------------------------------------------------------- |
| "pre-existing"              | A defect is a defect regardless of age.                              |
| "not related to my changes" | If it blocks the gate, it is related to forward work.                |
| "out of scope"              | Scope is a planning decision, not an excuse for red gates.           |
| "intermittent"              | Intermittent failures are still failures. Investigate, don't assume. |

## Specs

All planning and investigation output lives in `specs/` at the project root. Never put plans in commit messages or chat logs only.

- `specs/product/` — vision, scope, glossary
- `specs/release-plan.yaml` — release index and epic list
- `specs/epics/` — per-epic specification and story/task breakdown
- `specs/tech-architecture/` — tech stack, security, test, design, refactor, impact plans
- `specs/verifications/` — UAT and verification artifacts
- `specs/bugs/` — bug registry and investigation notes
- `specs/state.yaml` — current session state, handoff, and next skill

## Git Workflow

Workflow mode: `solo-git` (see `specs/state.yaml`).

- Create a feature branch for each epic or bug.
- Use the Preflight command before landing a branch.
- Ship via `scripts/land-branch.sh` (solo-local) instead of `gh pr create`.
- Keep `main` protected and deployable.
- Commit messages follow `type(scope): description` format.

## Code Conventions

See `AGENTS.md` for the full convention list. In short:

- TypeScript with strict mode, no `any`, no non-null assertions.
- Single quotes, semicolons, trailing commas.
- Named exports only; `export default` only for Express routers.
- 4-layer server architecture: router → controller → service → repository.
- Client pages manage their own state and call API modules directly.
- Every feature module has its own tests colocated with the code or in `server/test/`.

## Defensive Code

The following defensive categories apply to this project:

- **Input validation** — Zod schemas at all API boundaries; validate ownership in services.
- **Authentication** — JWT tokens, bcrypt password hashing, protected routes except `/health` and `/auth/register|login`.
- **Error handling** — `AppError` branded errors with consistent `{ code, message, details? }` responses.
- **Database safety** — Drizzle migrations only; never hand-edit the DB.
- **Testing** — Server tests use embedded PostgreSQL on port 5434; client tests run in jsdom with mocked API modules.

## Communication

- One clarifying question beats a wrong assumption.
- If a task is underspecified, call the appropriate bigpowers skill (`plan-work`, `scope-work`, `elaborate-spec`) before coding.
- Keep explanations short. Code is the primary artifact.
