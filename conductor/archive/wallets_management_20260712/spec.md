# Specification: Balances/Wallets Management

## Overview

Introduce a **Wallet** system to Budgeto. A wallet is a named container (e.g., "Cash", "Savings Pot", "Travel Fund") that groups expenses. The wallet's balance is **automatically computed** as the sum of all expenses linked to it. Positive transaction amounts increase the balance (money in), negative amounts decrease it (money out). Wallets are purely a self-accounting concept — no connection to real bank accounts.

## Functional Requirements

### FR-1: Wallet CRUD
- Users can **create** a wallet with a name and optional description/color.
- Users can **edit** a wallet's name, description, and color.
- Users can **delete** a wallet. Deleting a wallet that has linked expenses should prompt a decision: either re-assign expenses to another wallet or warn/block deletion.

### FR-2: Automatic Balance Calculation
- A wallet's balance is the **real-time sum** of all linked expense transactions.
- The balance is shown on the wallet everywhere it appears (dashboard, list, detail page).
- Balance is read-only (not directly editable by the user).

### FR-3: Manual Balance Adjustments
- Users can record a **manual adjustment** transaction on a wallet (e.g., "Initial balance set to 500" or "Correction: forgot to log 200").
- Adjustments behave like regular expense entries linked to that wallet.

### FR-4: Transfers Between Wallets
- Users can **transfer funds** from one wallet to another.
- A transfer creates two transactions: a negative entry on the source wallet and a positive entry on the destination wallet.

### FR-5: Expense-Wallet Linking
- Every expense entry includes a **wallet selector**.
- When creating or editing an expense, the user must choose (or be defaulted to) a wallet.

### FR-6: Wallet Visibility
- **Dashboard:** Show wallet summary cards with current balance.
- **Sidebar/Navigation:** Quick-access list of wallets.
- **Dedicated Page:** Full wallet management page with list, detail view, and transaction history per wallet.

## Non-Functional Requirements

- **Performance:** Wallet balance should be computed efficiently (via database aggregation, not client-side summing of all rows).
- **Consistency:** Transfers must be atomic (both credit and debit happen together or not at all).
- **Responsive:** Wallet UI must work well on mobile (PWA) as well as desktop.

## Acceptance Criteria

1. A user can create a wallet named "Groceries" and see it listed with a 0.00 balance.
2. A user records a +500 transaction on "Groceries" — balance shows 500.00.
3. A user records a -30 transaction on "Groceries" — balance shows 470.00.
4. A user transfers 100 from "Groceries" to "Savings" — Groceries shows 370.00, Savings shows 100.00.
5. A user deletes an empty wallet without issues.
6. Wallet balances are visible on the dashboard, in the sidebar, and on the dedicated wallets page.

## Out of Scope

- Connecting to real bank accounts or financial institutions.
- Multi-currency support (single currency for initial release).
- Budget limits tied per wallet (budgets remain category-based).
- Wallet sharing between users.
