# Implementation Plan: Balances/Wallets Management

## Phase 1: Database Schema – Wallets & Transactions

- [ ] Task: Define `wallets` table in Drizzle schema
    - [ ] Add `wallet` table (id uuid PK, user_id FK, name text, description text, color text, created_at, updated_at)
    - [ ] Add `transaction` table (id uuid PK, wallet_id FK, amount numeric, description text, created_at)
- [ ] Task: Run Drizzle migration to create tables
- [ ] Task: Write tests for schema shape and constraints
    - [ ] Verify table columns, types, and foreign key relationships
- [ ] Task: Implement schema in `server/src/db/schema.ts`
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Backend API – Wallet CRUD

- [ ] Task: Write tests for wallet API endpoints
    - [ ] POST /wallets – create wallet with name, returns 201
    - [ ] GET /wallets – list user's wallets, returns 200
    - [ ] GET /wallets/:id – get single wallet with computed balance
    - [ ] PUT /wallets/:id – update wallet name/description/color
    - [ ] DELETE /wallets/:id – delete wallet (404 if not found, 409 if has transactions)
- [ ] Task: Implement wallet repository (Drizzle data-access layer)
    - [ ] createWallet, findWalletById, findWalletsByUserId, updateWallet, deleteWallet
- [ ] Task: Implement wallet service (validation + business logic)
    - [ ] zod schema for create/update wallet input
    - [ ] Ownership check (user can only access own wallets)
- [ ] Task: Implement wallet controller (HTTP handlers)
    - [ ] createHandler, listHandler, getHandler, updateHandler, deleteHandler
- [ ] Task: Register wallet routes in app.ts (all under `/wallets` prefix, auth-protected)
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Backend API – Transactions & Balance

- [ ] Task: Write tests for transaction and transfer endpoints
    - [ ] POST /wallets/:id/transactions – create transaction, returns 201
    - [ ] GET /wallets/:id/transactions – list transactions for wallet, returns 200
    - [ ] POST /wallets/transfer – transfer between wallets (atomic), returns 200
    - [ ] Balance included in GET /wallets and GET /wallets/:id responses
- [ ] Task: Implement transaction repository
    - [ ] createTransaction, findTransactionsByWalletId
- [ ] Task: Implement transaction service
    - [ ] zod schema for create transaction input
    - [ ] zod schema for transfer input (sourceId, targetId, amount, description)
    - [ ] Atomic transfer logic (db transaction: two inserts)
- [ ] Task: Implement transaction controller
    - [ ] createTransactionHandler, listTransactionsHandler, transferHandler
- [ ] Task: Implement balance calculation (SQL aggregation via Drizzle)
    - [ ] Add balance field to wallet responses (computed, not stored)
- [ ] Task: Register transaction routes in app.ts
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Frontend – Wallet Management Pages

- [ ] Task: Write frontend API client module for wallets
    - [ ] createWallet, getWallets, getWallet, updateWallet, deleteWallet
    - [ ] createTransaction, getTransactions, transferFunds
- [ ] Task: Write tests for WalletList page
    - [ ] Renders list of wallets with balances
    - [ ] Navigate to create wallet form
    - [ ] Delete empty wallet with confirmation
- [ ] Task: Write tests for WalletCreate/Edit form
    - [ ] Form fields: name, description, color
    - [ ] Validation (name required)
    - [ ] Submit creates/updates wallet
- [ ] Task: Write tests for WalletDetail page
    - [ ] Shows wallet info and current balance
    - [ ] Lists transaction history sorted by date
    - [ ] Link to add new transaction
- [ ] Task: Implement WalletList page
- [ ] Task: Implement WalletCreate/Edit form component
- [ ] Task: Implement WalletDetail page
- [ ] Task: Add wallet routes to client router
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

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
