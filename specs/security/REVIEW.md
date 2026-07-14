# Security Review — Backend Auth Guard Cleanup

**Branch:** ref/auth-guard-cleanup
**Date:** 2026-07-14
**Reviewer:** agent (release-branch gate)

## Scope

6 files changed (113 insertions, 54 deletions). Primary categories:

- **Server controllers:** Removed 13 unreachable `if (!req.user) throw unauthorizedError()` guards from wallets, categories, and transactions controllers. Auth enforcement remains in the `authenticate` middleware (unchanged).
- **Middleware:** Added `getUser()` helper — pure type narrowing, no runtime auth check.
- **Spec files:** Updated planning-context.yaml, added verification evidence.

## Findings

### Injection
- ✅ No new queries — all DB access unchanged (Drizzle ORM)
- ✅ No user input interpolated

### Broken Auth
- ✅ Auth enforcement unchanged — `authenticate` middleware untouched, still applied via `router.use(authenticate)` on all protected routes
- ✅ Guards removed were dead code (middleware always sets `req.user` or calls `next(error)`)
- ✅ `getUser()` helper does not bypass auth — it's a pure type-narrowing `as` cast
- ✅ All 11 existing unauthenticated-request tests (401) still pass

### Sensitive Data Exposure
- ✅ No new fields, no response shape changes

### Security Misconfiguration
- ✅ No CORS, env, or dependency changes

### Secrets
- ✅ No secrets in diff

## Verdict

**PASS** — No security concerns. Dead-code removal only. Auth enforcement path is unchanged.
