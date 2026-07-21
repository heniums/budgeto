# Story e02s02: Period navigation with historical period view

**type:** feat
**risk:** P2
**context:** domain
**status:** planned
**bcps:** 3
**delta:** MODIFIED

## Summary

Add period navigation to the budget detail view so users can browse historical periods. The GET /budgets/:id endpoint accepts an optional `?period=` query parameter (e.g., `?period=2024-01` for January 2024) that overrides the default current period. The client adds prev/next buttons and a period label to navigate through time.

## Context

e02s01 computes the current period on-the-fly. This story extends that by allowing the caller to pass a reference date (via a `period` query param) so the same budget definition can be viewed against any historical period. The period computation utility from e02s01 already accepts an optional `referenceDate` — this story wires it to the API and UI.

## Requirements

### MODIFIED: GET /budgets/:id endpoint
**Before:** `GET /budgets/:id` returns the budget with spent calculated against stored startDate/endDate.
**After:** `GET /budgets/:id?period=2024-01` returns the budget with spent calculated against the computed period window for the requested period. When `period` is omitted, the current period is used (default from e02s01).

### ADDED: Period parameter in client API
The client `getBudget(id)` function is extended to accept an optional `period` parameter: `getBudget(id, { period: '2024-01' })`.

### ADDED: Period navigation UI
The Budgets page gains period navigation controls:
- A period label showing the current displayed period (e.g., "January 2025")
- A "previous period" button that decrements by one period unit
- A "next period" button that increments by one period unit (disabled when viewing current period)
- Navigation triggers a re-fetch of the budget data for the selected period

### ADDED: Historical period spent display
When a historical period is selected, the budget card displays spent vs. limit for that period instead of the current period. The budget definition (name, categories, limits) remains unchanged.

## Out of scope

- Period-over-period comparison (side-by-side view of two periods)
- Chart/trend visualization of spending over time
- Caching/computed columns for historical period data (always computed live from transactions)

## Risks

- Performance: computing spent for 12+ historical periods could be slow if transaction volume is high. Mitigation: ensure database indexes on `transactions.date` and `transactions.categoryId` exist.
- UX: users might expect the period navigation to persist across page reloads. Mitigation: use URL query params to represent the current period selection (future enhancement).
- Future periods: navigating to a period beyond the current date shows zero spent (correct behavior, but may confuse users). Mitigation: disable "next period" when at current period.

## Steps

1. Add period parameter to budgets API (GET /budgets/:id?period=2024-01) → verify: `npx vitest run server/test/budgets.test.ts`
2. Update budgets service to accept period param and compute spent for that period → verify: `npx vitest run server/test/budgets.test.ts`
3. Add period navigation UI (prev/next buttons, period label) to Budgets page → verify: `npx vitest run client/src/pages/Budgets.test.tsx`
4. Update client budgets API to accept and pass period parameter → verify: `npx vitest run client/src/api/budgets.test.ts`
5. Run full preflight and fix any failing gates → verify: `npm test && npm run lint && npm run build`
