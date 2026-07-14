# Story e08s01 — Category Data Plumbing: Column, Type, and Server JOIN

**Maturity:** 3
**Type:** feat
**Risk:** P0
**Context:** The DB schema includes `categoryId` on transactions and the server's
`create` service validates it, but the `listByUser` endpoint (used by Home)
omits `categoryId` from the response. The transaction table shows no Category
column. This story connects the data that's already there to the UI.

**Zoom-out — server/src/transactions/repository.ts:**

- Purpose: Pure data access for transactions — SELECT, INSERT, JOIN queries.
- Callers: `listByUser` (service), `list` (service), `create` (service), `transfer` (service).
- Contracts: Returns `Transaction[]` scoped by `userId` via wallet JOIN. Must not leak cross-user data.

**Zoom-out — client/src/api/transactions.ts:**

- Purpose: Typed API functions wrapping axios for `/transactions` endpoints.
- Callers: Home.tsx, WalletDetail.tsx, TransactionForm.tsx.
- Contracts: Returns `UserTransactionsResult` with `TransactionData[]`. Fields must match server response.

## Requirements

### MODIFIED: Server GET /transactions response includes category data

**Before:** `listByUser` returned only `id`, `walletId`, `amount`, `description`, `createdAt`.
**After:** Also returns `categoryId` (string | null) and `categoryName` (string | null), sourced from a LEFT JOIN on the categories table.

### MODIFIED: TransactionData client type includes category fields

**Before:** `TransactionData` had `id`, `walletId`, `amount`, `description`, `createdAt`.
**After:** Adds `categoryId: string | null` and `categoryName: string | null`.

### ADDED: Category column in Home transaction table

- New table column between Wallet and Description: "Category".
- Renders a colored badge using the category's color (from server data or a fallback).
- Shows category name in the badge, or "—" when `categoryId` is null.
- The badge is interactive — it's the anchor point for long-press/right-click (e08s03).

### ADDED: Categories fetched on Home mount

- Home.tsx fetches `getCategories()` alongside `getTransactions()` and `getWallets()`.
- Category map is used to resolve `categoryName` from `categoryId` for display, and for the empty-state checks (e08s02).

## Acceptance Criteria (§17 — Gherkin)

```gherkin
Feature: Category data in transaction list
  Scenario: Category column appears for categorized transactions
    Given the user has a transaction with a category assigned
    When they view the Home page
    Then the Category column shows the category name in a colored badge

  Scenario: Uncategorized transactions show placeholder
    Given the user has a transaction without a category
    When they view the Home page
    Then the Category column shows "—"

  Scenario: Category color from server is used
    Given a category has a custom color
    When it appears in the Category column
    Then the badge uses that category's color

  Scenario: No existing tests break
    Given the existing test suite
    When the category fields are added to the server response
    Then all existing tests continue to pass
```

## Out of Scope

- Category creation from the transaction table (e08s02/e08s04).
- Context menu on category badges (e08s03).
- Editing category details (e08s03).

## Risks

- **Cross-user data leakage**: The JOIN must stay scoped to the user's wallets (already enforced by `eq(wallets.userId, userId)` in the WHERE clause). Category ownership is validated at creation time; the JOIN does not introduce a new access path.
- **Breaking existing tests**: Tests that assert exact response shapes may need updating to include the new fields.
- **Null safety**: `categoryId` is nullable in the DB — the client must handle `null` gracefully in every render path.
