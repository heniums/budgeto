# Budgeto — Methodology

# Derived from conductor/workflow.md on 2026-07-13

#

# This document captures the analytical lenses and workflow disciplines

# that agents should apply during planning, development, and review

## Active Lenses

### TDD (Test-Driven Development)

- **Principle:** Red → Green → Refactor cycle for every task.
- **Application:** Write failing tests first, then minimum code to pass, then refactor.
- **Verification:** Run `CI=true npm test` — all tests must pass before marking a task complete.

### Cost of Delay (CD3)

- **Principle:** Prioritize work by the cost of delay divided by duration.
- **Application:** Used in WSJF ordering of epics in release-plan.yaml.
- **Reference:** `specs/release-plan.yaml` — epics ordered by WSJF score.

### Coverage Gates

- **Principle:** >80% coverage on lines, functions, branches, and statements.
- **Application:** Run `npm run test:coverage` after each task implementation.
- **Verification:** Coverage report must show ≥80% across all metrics.

### Phase Checkpoints

- **Principle:** After completing a phase, run the checkpoint protocol.
- **Application:**
  1. Determine phase scope via git diff from previous checkpoint SHA.
  2. Verify tests exist for all changed code files.
  3. Execute automated test suite.
  4. Propose manual verification plan.
  5. Await user confirmation.
  6. Create checkpoint commit with verification report as git note.

### Conventional Commits

- **Principle:** All commits follow `<type>(<scope>): <description>` format.
- **Types:** feat, fix, docs, style, refactor, test, chore.
- **Verification:** Every commit message must match the pattern.

### Quality Gates (per task)

Before marking any task complete, verify:

- All tests pass
- Code coverage ≥80%
- Code follows style guides
- Type safety enforced
- No linting/static analysis errors
- Documentation updated if needed
- No security vulnerabilities introduced

### Definition of Done

A task is complete when:

1. All code implemented to specification
2. Unit tests written and passing
3. Code coverage meets requirements
4. Documentation complete (if applicable)
5. Code passes all linting and static analysis
6. Works correctly on mobile (if applicable)
7. Changes committed with proper message

## Development Commands

```bash
npm install                  # Install all dependencies
npm run dev                  # Start DB, server (tsx watch), client (Vite) concurrently
npm run db                   # Start embedded PostgreSQL + apply migrations (port 5433)
npm test                     # Run all tests (server then client)
npm run test:watch           # Watch-mode tests (vitest)
npm run test:coverage        # Run tests with coverage
npm run type-check           # tsc --noEmit full project type-check
npm run lint                 # ESLint on .ts/.tsx files
npm run lint:fix             # ESLint with auto-fix
npm run format               # Prettier on all source files
npm run build                # Type-check + Vite production build
npx drizzle-kit generate     # Generate a migration from schema.ts changes
npx drizzle-kit migrate      # Apply migrations
```

## Emergency Procedures

### Critical Bug in Production

1. Create hotfix branch from main
2. Write failing test for bug
3. Implement minimal fix
4. Test thoroughly including mobile
5. Deploy immediately
6. Document in relevant epic

### Security Breach

1. Rotate all secrets immediately
2. Review access logs
3. Patch vulnerability
4. Notify affected users (if any)
5. Document and update security procedures

source: conductor/workflow.md
