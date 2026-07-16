# Story e08s05 — Tests and Type-Check Coverage

**Maturity:** 3
**Type:** feat
**Risk:** P1
**Context:** The previous four stories introduce new server response fields,
new client components (OnboardingWizard, WalletDetailSheet, CategoryDetailSheet,
context menus, stacked modals), and modified existing components (Home,
TransactionForm, TransferForm). This story ensures all new and changed code is
tested and type-checks cleanly.

## Requirements

### MODIFIED: Server tests assert category fields

**Before:** Server transaction tests asserted response shapes without category fields.
**After:** Existing tests that list transactions now assert `categoryId` (string | null) and `categoryName` (string | null) are present in each transaction. A new test creates a transaction with a category and verifies the category name is returned.

### MODIFIED: Client API tests assert new TransactionData fields

**Before:** `client/src/api/transactions.test.ts` asserted only old fields.
**After:** Tests assert `categoryId` and `categoryName` are present in mocked getTransactions responses.

### ADDED: OnboardingWizard tests

- Renders all 3 steps with correct content.
- Auto-advances on step completion.
- Dismissable via X button.
- Sets `budgeto:wizardDismissed` in localStorage on dismiss.
- Does not render when `wizardDismissed` is set.

### ADDED: Home empty-state tests

- Renders "Create your first wallet" prompt when wallets = [].
- Renders "Create your first category" prompt when wallets > 0, categories = [].
- Renders normal table when both exist.
- CTA buttons trigger the correct dialog/modal.

### ADDED: Context menu tests

- Right-clicking a wallet name cell opens the context menu.
- Selecting "View wallet details" opens WalletDetailSheet.
- Right-clicking a category badge opens the context menu.
- Long-press handler fires after 500ms touch hold.

### ADDED: Stacked modal tests

- Transaction form field values persist after opening and closing a sub-view.
- Newly created wallet/category is auto-selected in the form.
- Cancel returns to form with no changes.

### ADDED: Type-check gate

- `npm run type-check` (tsc --noEmit) passes with zero errors.
- No `as any`, no `@ts-ignore`, no non-null assertions (`!`) introduced.

### ADDED: Coverage gate

- `npm run test:coverage` shows >= 80% on lines, functions, branches, statements.

## Acceptance Criteria (§17 — Gherkin)

```gherkin
Feature: Test and type-check coverage
  Scenario: Server tests pass with category fields
    Given the updated server code
    When they run npm test -- --run server
    Then all tests pass and category fields are asserted

  Scenario: Client tests cover new components
    Given the updated client code
    When they run npm test -- --run client
    Then all new component tests pass

  Scenario: Full test suite passes
    When they run npm test
    Then all tests pass and coverage is >= 80%

  Scenario: TypeScript compiles cleanly
    When they run npm run type-check
    Then the command exits with code 0 and no errors
```

## Out of Scope

- E2E tests (Playwright/Cypress).
- Accessibility audit (axe-core).
- Visual regression tests (Chromatic/Percy).

## Risks

- **Coverage regression**: Adding new components without tests could drop coverage below 80%. Write tests alongside implementation (TDD), not after.
- **Test flakiness**: Long-press handler tests with timers require `vi.useFakeTimers()` — ensure cleanup in `afterEach`.
- **Mock complexity**: ContextMenu (Radix) uses portals — tests must account for `document.body` rendering. Use `@testing-library/react`'s `baseElement` for portal queries.
