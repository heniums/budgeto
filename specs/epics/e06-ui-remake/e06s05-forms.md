# Story e06s05 — Forms: TransactionForm / TransferForm on shadcn Form

**Maturity:** 3
**Type:** refactor
**Risk:** P1
**Context:** `client/src/components/TransactionForm.tsx` and `TransferForm.tsx` currently produce react-hook-form resolver type errors (TS2322/TS2345) under `@hookform/resolvers` v5. This story reworks both onto shadcn `Form` (built on react-hook-form + Radix), resolving the type errors and aligning forms with the new component system. These forms are opened from Home (e06s03).

## Requirements

### MODIFIED: TransactionForm
- **Before:** Hand-rolled inputs with a react-hook-form resolver typed against optional fields, causing TS2322/TS2345.
- **After:** Uses shadcn `Form`, `FormField`, `FormItem`, `FormControl` + shadcn `Input`/`Select`/`Label`; resolver types resolve cleanly.

### MODIFIED: TransferForm
- **After:** Same shadcn Form treatment; source/target wallet selects + amount.

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: shadcn forms
  Scenario: Type-check passes
    Given the reworked forms
    When I run npm run type-check
    Then there are no TS2322/TS2345 errors from TransactionForm or TransferForm

  Scenario: Submit creates a transaction
    Given the TransactionForm on Home
    When the user fills and submits valid data
    Then the transaction is created via the API
```

## Out of Scope
- New validation rules beyond existing.
- Backend changes.

## Risks
- `@hookform/resolvers` v5 generic signature differs from v3 — follow shadcn's current Form recipe exactly.
