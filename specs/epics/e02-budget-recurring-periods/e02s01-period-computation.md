# Story e02s01: Period computation and current period display

**type:** feat
**risk:** P1
**context:** domain
**status:** planned
**bcps:** 5
**delta:** MODIFIED

## Summary

Compute the current period window from a budget's period type (monthly/weekly/yearly/custom) on-the-fly, without storing period instances. Update the budget API response to include the current period's computed window, spent amount per category, and remaining limit per category. Update the client Budgets page to display current-period spent vs. limit.

## Context

Currently, budgets store explicit `startDate`/`endDate` columns and calculate spent by summing transactions within that fixed range. This story replaces fixed date ranges with computed period windows: the budget's `period` type determines how the window is calculated (e.g., "monthly" = first day of current month → last day of current month), and the `startDate`/`endDate` columns become computed properties.

## Requirements

### MODIFIED: Budget period computation
**Before:** Budget startDate and endDate are user-provided strings stored in the database and used directly as the transaction filter range.
**After:** Budget period type (monthly, weekly, yearly, custom) drives a `computePeriodWindow(budget, referenceDate?)` utility that returns `{ startDate, endDate }` for the current period. The reference date defaults to today and can be overridden for historical period navigation (e02s02).

### MODIFIED: Budget spent calculation
**Before:** `sumTransactionsByUserAndCategoryAndRange(userId, categoryId, startDate, endDate)` is called with the budget's stored start/end dates.
**After:** The same repository function is called with the computed period window dates. The function signature and behavior are unchanged — only the caller changes.

### MODIFIED: Budget API response shape
**Before:** The budget response includes `startDate` and `endDate` as stored database columns.
**After:** The response adds a `periodWindow` object with `{ startDate, endDate }` representing the current computed period. The original `startDate`/`endDate` fields are removed from the response (they are computed, not stored).

### ADDED: Current period display on client
The Budgets page displays the current period label (e.g., "January 2025") and shows spent vs. limit for the computed period window.

## Out of scope

- Period navigation (prev/next buttons, historical periods) — covered by e02s02
- Removing startDate/endDate from the database schema — migration handled as part of schema change task
- `weekly` period type — can be added when period enum is expanded in a future story

## Risks

- Timezone edge cases: period boundaries must be computed in the user's timezone. Mitigation: use dayjs UTC helpers consistently.
- Month-boundary correctness (28/30/31 days, leap years). Mitigation: unit-test with boundary dates.
- Existing tests that rely on stored startDate/endDate in API responses will break. Mitigation: update test fixtures to use computed period windows.

## Steps

1. Implement `computePeriodWindow` utility with unit tests → verify: `npx vitest run server/src/budgets/period.test.ts`
2. Update budgets repository to accept computed period dates (no signature change needed; caller changes only) → verify: `npx vitest run server/src/budgets/period.test.ts`
3. Update budgets service to compute current period and return spent vs limit per category → verify: `npx vitest run server/src/budgets/period.test.ts`
4. Update budgets API response to include current period data → verify: `npx vitest run server/test/budgets.test.ts`
5. Update client Budgets page to display current period spent vs limit → verify: `npx vitest run client/src/pages/Budgets.test.tsx`
6. Run full preflight and fix any failing gates → verify: `npm test && npm run lint && npm run build`
