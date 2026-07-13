# Story e06s06 — Tests & type-check cleanup

**Maturity:** 3
**Type:** test
**Risk:** P2
**Context:** The remake touches Layout, Sidebar, router, Home, Settings, and the two forms. This story ensures the full client suite passes with the new structure, dead pages/components are removed, and `npm run type-check` is clean project-wide (the pre-existing WalletForm/TransferForm errors are gone via e06s05; unused imports e.g. `and` in server wallets repository and `secondId` in transaction test are cleaned).

## Requirements

### ADDED: Updated/removed tests
- Client tests cover Home list + filters, Settings tabs, new nav, and forms.
- Tests for removed pages (Dashboard, WalletList/WalletDetail standalone routes, old Category routes, Profile route) are deleted or relocated.

### MODIFIED: Type-check clean
- **Before:** TS2322/TS2345 in WalletForm/TransferForm; TS6133 unused `and` (server wallets repository) and `secondId` (transaction test).
- **After:** `npm run type-check` exits 0 project-wide.

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: Test & type hygiene
  Scenario: Client tests green
    Given the remade UI
    When I run npm test -- --run client
    Then all client tests pass

  Scenario: Type-check clean
    When I run npm run type-check
    Then it exits 0 with no errors
```

## Out of Scope
- Raising coverage thresholds above 80%.
- Server feature changes.

## Risks
- Removing pages can leave dangling imports/tests — run full suite after deletions.
