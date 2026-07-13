# Implementation Plan: Centralized HTTP Client with Axios

## Phase 1: Create Axios Client Module [checkpoint: 01bcc2d]

- [x] Task: Install axios dependency `0ee13c9`
    - [x] Run `npm install axios` in the `client/` directory
    - [x] Verify axios is added to `client/package.json`
- [x] Task: Create the axios instance and interceptors (`client/src/api/client.ts`) `0ee13c9`
    - [x] Define a pre-configured axios instance with `VITE_API_BASE_URL` as `baseURL`
    - [x] Implement a request interceptor that reads `budgeto.token` from localStorage and sets `Authorization: Bearer <token>` header
    - [x] Implement a response interceptor that:
        - [x] Normalizes error responses into `ApiError` (message, status, code)
        - [x] On 401 responses: clears the token from localStorage and dispatches a custom event for auth state reset
    - [x] Export the configured axios instance as a singleton
- [x] Task: Write tests for the axios client module `0ee13c9`
    - [x] Test that the request interceptor attaches the token when present
    - [x] Test that the request interceptor does not attach a header when no token exists
    - [x] Test that the response interceptor normalizes errors into `ApiError`
    - [x] Test that the response interceptor handles 401 by clearing the token
    - [x] Test that the response interceptor re-throws errors so callers can catch them
- [x] Task: Conductor - User Manual Verification 'Phase 1: Create Axios Client Module' (Protocol in workflow.md) `01bcc2d`
[checkpoint: 01bcc2d]

## Phase 2: Refactor API Functions

- [x] Task: Refactor `client/src/api/auth.ts` to use the axios client
    - [x] Import the axios client from `./client`
    - [x] Remove the local `request()` and `authHeader()` helper functions
    - [x] Refactor each exported function (`register`, `login`, `getMe`, `updateName`, `changePassword`) to use the axios client
    - [x] Remove the `token` parameter from all function signatures
    - [x] Keep the `ApiError` export (it will be imported from `./client` or kept locally)
- [x] Task: Refactor `client/src/api/wallets.ts` to use the axios client
    - [x] Import the axios client from `./client`
    - [x] Remove the local `request()` and `authHeader()` helper functions
    - [x] Refactor each exported function (`createWallet`, `getWallets`, `getWallet`, `updateWallet`, `deleteWallet`, `createTransaction`, `getTransactions`, `transferFunds`) to use the axios client
    - [x] Remove the `token` parameter from all function signatures
- [x] Task: Write/update tests for refactored API functions
    - [x] Update existing tests that mock `fetch` to mock axios instead
    - [x] Verify all existing test scenarios still pass
- [x] Task: Conductor - User Manual Verification 'Phase 2: Refactor API Functions' (Protocol in workflow.md) `4817eed`

## Phase 3: Update Consumer Components

- [x] Task: Update consumer components to remove manual token passing
    - [x] `AuthContext.tsx` — remove `token` arg from `getMe()` calls
    - [x] `Dashboard.tsx` — remove `token` arg from `getWallets()` call
    - [x] `WalletList.tsx` — remove `token` arg from `getWallets()` and `deleteWallet()` calls
    - [x] `WalletDetail.tsx` — remove `token` arg from `getWallet()` and `getTransactions()` calls
    - [x] `WalletForm.tsx` — remove `token` arg from `getWallet()`, `createWallet()`, and `updateWallet()` calls
    - [x] `Profile.tsx` — remove `token` arg from `updateName()` and `changePassword()` calls
    - [x] `TransactionForm.tsx` — remove `token` prop and arg from `createTransaction()` call
    - [x] `TransferForm.tsx` — remove `token` prop and arg from `transferFunds()` call
    - [x] `Sidebar.tsx` — remove `token` arg from `getWallets()` call
- [x] Task: Update test files for consumer components
    - [x] Update mocks and assertions in component test files to match new signatures (no token args)
    - [x] Verify all component tests still pass
- [x] Task: Conductor - User Manual Verification 'Phase 3: Update Consumer Components' (Protocol in workflow.md) `5549471`

## Phase 4: Final Verification & Cleanup

- [x] Task: Run full test suite and verify coverage
    - [x] Run `CI=true npm test` from the client directory
    - [x] Verify all tests pass (162 total: 68 server + 94 client)
    - [x] Verify code coverage meets the >80% threshold
- [x] Task: Run linting and type checking
    - [x] Run linter on changed files (no new errors introduced)
    - [x] Run TypeScript type checking (`npx tsc --noEmit`) (no new errors introduced)
    - [x] Fix any issues found (fixed unused `navigate` in WalletList.tsx)
- [x] Task: Conductor - User Manual Verification 'Phase 4: Final Verification & Cleanup' (Protocol in workflow.md) `67588e3`

## Phase: Review Fixes
- [x] Task: Apply review suggestions `41e5ef8`
