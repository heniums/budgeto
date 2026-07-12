# Implementation Plan: Balances/Wallets Management

## Phase 1: Database Schema – Wallets & Transactions [checkpoint: e999d16]

- [x] Task: Define `wallets` table in Drizzle schema 59ec02f
    - [x] Add `wallet` table (id uuid PK, user_id FK, name text, description text, color text, created_at, updated_at)
    - [x] Add `transaction` table (id uuid PK, wallet_id FK, amount numeric, description text, created_at)
- [x] Task: Run Drizzle migration to create tables 59ec02f
- [x] Task: Write tests for schema shape and constraints 59ec02f
    - [x] Verify table columns, types, and foreign key relationships
- [x] Task: Implement schema in `server/src/db/schema.ts` 59ec02f
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) e999d16

## Phase 2: Backend API – Wallet CRUD [checkpoint: 251b237]

- [x] Task: Write tests for wallet API endpoints eadcdbe
    - [x] POST /wallets – create wallet with name, returns 201
    - [x] GET /wallets – list user's wallets, returns 200
    - [x] GET /wallets/:id – get single wallet with computed balance
    - [x] PUT /wallets/:id – update wallet name/description/color
    - [x] DELETE /wallets/:id – delete wallet (404 if not found, 409 if has transactions)
- [x] Task: Implement wallet repository (Drizzle data-access layer) eadcdbe
    - [x] createWallet, findWalletById, findWalletsByUserId, updateWallet, deleteWallet
- [x] Task: Implement wallet service (validation + business logic) eadcdbe
    - [x] zod schema for create/update wallet input
    - [x] Ownership check (user can only access own wallets)
- [x] Task: Implement wallet controller (HTTP handlers) eadcdbe
    - [x] createHandler, listHandler, getHandler, updateHandler, deleteHandler
- [x] Task: Register wallet routes in app.ts (all under `/wallets` prefix, auth-protected) eadcdbe
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md) 251b237

## Phase 3: Backend API – Transactions & Balance [checkpoint: 1eced3f]

- [x] Task: Write tests for transaction and transfer endpoints b76ff08
    - [x] POST /wallets/:id/transactions – create transaction, returns 201
    - [x] GET /wallets/:id/transactions – list transactions for wallet, returns 200
    - [x] POST /wallets/transfer – transfer between wallets (atomic), returns 200
    - [x] Balance included in GET /wallets and GET /wallets/:id responses
- [x] Task: Implement transaction repository b76ff08
    - [x] createTransaction, findTransactionsByWalletId
- [x] Task: Implement transaction service b76ff08
    - [x] zod schema for create transaction input
    - [x] zod schema for transfer input (sourceId, targetId, amount, description)
    - [x] Atomic transfer logic (db transaction: two inserts)
- [x] Task: Implement transaction controller b76ff08
    - [x] createTransactionHandler, listTransactionsHandler, transferHandler
- [x] Task: Implement balance calculation (SQL aggregation via Drizzle) b76ff08
    - [x] Add balance field to wallet responses (computed, not stored)
- [x] Task: Register transaction routes in app.ts b76ff08
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md) 1eced3f

## Phase 4: Frontend – Wallet Management Pages [checkpoint: ff80493]

- [x] Task: Write frontend API client module for wallets 9cf3a33
    - [x] createWallet, getWallets, getWallet, updateWallet, deleteWallet
    - [x] createTransaction, getTransactions, transferFunds
- [x] Task: Write tests for WalletList page 9cf3a33
    - [x] Renders list of wallets with balances
    - [x] Navigate to create wallet form
    - [x] Delete empty wallet with confirmation
- [x] Task: Write tests for WalletCreate/Edit form 9cf3a33
    - [x] Form fields: name, description, color
    - [x] Validation (name required)
    - [x] Submit creates/updates wallet
- [x] Task: Write tests for WalletDetail page 9cf3a33
    - [x] Shows wallet info and current balance
    - [x] Lists transaction history sorted by date
    - [x] Link to add new transaction
- [x] Task: Implement WalletList page 9cf3a33
- [x] Task: Implement WalletCreate/Edit form component 9cf3a33
- [x] Task: Implement WalletDetail page 9cf3a33
- [x] Task: Add wallet routes to client router 9cf3a33
- [x] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md) ff80493

## Phase 5: Frontend – Dashboard & Wallet Integration

- [ ] Task: Write tests for Dashboard page
    - [ ] Renders wallet summary cards with balances
    - [ ] Shows total balance across all wallets
    - [ ] Quick-add transaction from dashboard
- [ ] Task: Write tests for Sidebar/Navigation component
    - [ ] Lists wallets with current balances
    - [ ] Active wallet highlight
    - [ ] Link to wallet management page
- [ ] Task: Write tests for TransactionForm component
    - [ ] Form fields: wallet selector, amount, description
    - [ ] Validation (wallet required, amount required)
    - [ ] Submit creates transaction
- [ ] Task: Implement Dashboard page
- [ ] Task: Implement Sidebar/Navigation component with wallet list
- [ ] Task: Implement TransactionForm component
- [ ] Task: Implement TransferForm component
- [ ] Task: Integrate sidebar, dashboard, and wallet routes into App layout
- [ ] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)
