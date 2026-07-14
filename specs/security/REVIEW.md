# Security Review — e08 Guided User Experience

**Branch:** feat/e08-guided-ux
**Date:** 2026-07-14
**Reviewer:** agent (verify-work gate)

## Scope

34 files changed (2306 insertions, 104 deletions). Primary categories:

- **Server:** Added LEFT JOIN on categories table in `findTransactionsByUserId`. Added `categoryName` field to `listByUser` response. No new routes, no new mutation endpoints.
- **Client:** New components (OnboardingWizard, WalletDetailSheet, CategoryDetailSheet, context-menu UI). Modified Home.tsx, TransactionForm.tsx. Added `@radix-ui/react-context-menu` dependency.

## Findings

### Injection

- ✅ No new queries — `leftJoin(categories, ...)` uses Drizzle ORM parameterized query builder
- ✅ No user input interpolated into SQL
- ✅ All existing queries use Drizzle ORM exclusively

### Broken Auth

- ✅ Auth enforcement unchanged — `authenticate` middleware untouched
- ✅ `getUser()` helper from previous refactor still used in controllers
- ✅ LEFT JOIN on categories table scoped by `eq(wallets.userId, userId)` — no cross-user data access
- ✅ All 11 existing unauthenticated-request tests (401) still pass
- ✅ New OnboardingWizard calls authenticated APIs (createWallet, createCategory) — same auth flow

### Sensitive Data Exposure

- ✅ `categoryName` field added to response — already public (category names are visible to the owning user)
- ✅ No user emails, password hashes, or tokens added to new responses
- ✅ localStorage key `budgeto:wizardDismissed` stores only boolean — no sensitive data

### Security Misconfiguration

- ✅ No CORS changes
- ✅ No env configuration changes
- ✅ ESLint config updated to exclude stale build artifacts only — no security impact

### Dependency Review

- ✅ `@radix-ui/react-context-menu` — Radix primitive, same ecosystem as existing shadcn dependencies. No known vulnerabilities.
- ✅ No other new dependencies

### Client-Side

- ✅ localStorage wrapped in try/catch for private browsing compatibility
- ✅ No XSS vectors introduced — all user data rendered via React JSX (auto-escaped)
- ✅ Context menu actions trigger existing API calls with JWT auth

## Verdict

**PASS** — No security concerns. The only server change is a read-only LEFT JOIN on the categories table, already scoped by user ID. Client changes add UI components that reuse existing authenticated API calls. No new attack surface.
