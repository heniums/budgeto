# Story e06s03 — Home: All-transactions list with filters

**Maturity:** 3
**Type:** feat
**Risk:** P0
**Context:** Home replaces the Dashboard as the app's landing page. It lists ALL of the user's transactions (across wallets) with filters (wallet / category / type / date), a search box, pagination, and Add-transaction / Transfer buttons that open the forms (e06s05).

## Requirements

### ADDED: Transactions client module
- If absent, add `client/src/api/transactions.ts` with `getTransactions(filters)` returning the list (+ pagination meta) and `getTransaction(id)`.

### ADDED: User-scoped, filterable list endpoint
- VERIFY: a server `GET /transactions` exists that returns the authenticated user's transactions filtered by walletId / categoryId / type / date range. If it does not exist, implement it in the existing `server/src/transactions/` module (repository + service + controller + route) before the client list.
- Security: endpoint must be auth-protected and scoped to `req.user.sub` (no cross-user leakage).

### ADDED: Home page
- Table/card list of transactions (date, wallet, category, description, amount, type) with filters, search, and pagination (shadcn Table / Pagination).
- "Add transaction" and "Transfer" buttons open the forms (e06s05) — inline or in a dialog.

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: Home transactions list
  Scenario: Lists all user transactions
    Given an authenticated user with transactions in multiple wallets
    When they open Home
    Then they see every transaction across all wallets, newest first

  Scenario: Filters narrow the list
    Given the transactions list
    When they filter by a wallet and a type
    Then only matching transactions are shown

  Scenario: Pagination works
    Given more transactions than one page
    When they advance the page
    Then the next page of results loads

  Scenario: Add transaction persists
    Given the Home page
    When they click Add transaction and submit the form
    Then the new transaction appears at the top of the list
```

## Out of Scope
- Editing transactions inline (reuse existing behavior if present).
- Dashboard summary cards (OOS-1).

## Risks
- Cross-user data leakage if the list endpoint isn't user-scoped — security gate: verify `req.user.sub` filtering in tests.
- Missing list endpoint on the server — explicit verify step before client work.
