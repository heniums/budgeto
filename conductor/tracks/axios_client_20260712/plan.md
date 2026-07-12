# Implementation Plan: Centralized HTTP Client with Axios

## Phase 1: Create Axios Client Module

- [ ] Task: Install axios dependency
    - [ ] Run `npm install axios` in the `client/` directory
    - [ ] Verify axios is added to `client/package.json`
- [ ] Task: Create the axios instance and interceptors (`client/src/api/client.ts`)
    - [ ] Define a pre-configured axios instance with `VITE_API_BASE_URL` as `baseURL`
    - [ ] Implement a request interceptor that reads `budgeto.token` from localStorage and sets `Authorization: Bearer <token>` header
    - [ ] Implement a response interceptor that:
        - [ ] Normalizes error responses into `ApiError` (message, status, code)
        - [ ] On 401 responses: clears the token from localStorage and dispatches a custom event for auth state reset
    - [ ] Export the configured axios instance as a singleton
- [ ] Task: Write tests for the axios client module
    - [ ] Test that the request interceptor attaches the token when present
    - [ ] Test that the request interceptor does not attach a header when no token exists
    - [ ] Test that the response interceptor normalizes errors into `ApiError`
    - [ ] Test that the response interceptor handles 401 by clearing the token
    - [ ] Test that the response interceptor re-throws errors so callers can catch them
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Create Axios Client Module' (Protocol in workflow.md)

## Phase 2: Refactor API Functions

- [ ] Task: Refactor `client/src/api/auth.ts` to use the axios client
    - [ ] Import the axios client from `./client`
    - [ ] Remove the local `request()` and `authHeader()` helper functions
    - [ ] Refactor each exported function (`register`, `login`, `getMe`, `updateName`, `changePassword`) to use the axios client
    - [ ] Remove the `token` parameter from all function signatures
    - [ ] Keep the `ApiError` export (it will be imported from `./client` or kept locally)
- [ ] Task: Refactor `client/src/api/wallets.ts` to use the axios client
    - [ ] Import the axios client from `./client`
    - [ ] Remove the local `request()` and `authHeader()` helper functions
    - [ ] Refactor each exported function (`createWallet`, `getWallets`, `getWallet`, `updateWallet`, `deleteWallet`, `createTransaction`, `getTransactions`, `transferFunds`) to use the axios client
    - [ ] Remove the `token` parameter from all function signatures
- [ ] Task: Write/update tests for refactored API functions
    - [ ] Update existing tests that mock `fetch` to mock axios instead
    - [ ] Verify all existing test scenarios still pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Refactor API Functions' (Protocol in workflow.md)

## Phase 3: Update Consumer Components

- [ ] Task: Update consumer components to remove manual token passing
    - [ ] `AuthContext.tsx` — remove `token` arg from `getMe()` calls
    - [ ] `Dashboard.tsx` — remove `token` arg from `getWallets()` call
    - [ ] `WalletList.tsx` — remove `token` arg from `getWallets()` and `deleteWallet()` calls
    - [ ] `WalletDetail.tsx` — remove `token` arg from `getWallet()` and `getTransactions()` calls
    - [ ] `WalletForm.tsx` — remove `token` arg from `getWallet()`, `createWallet()`, and `updateWallet()` calls
    - [ ] `Profile.tsx` — remove `token` arg from `updateName()` and `changePassword()` calls
    - [ ] `TransactionForm.tsx` — remove `token` prop and arg from `createTransaction()` call
    - [ ] `TransferForm.tsx` — remove `token` prop and arg from `transferFunds()` call
    - [ ] `Sidebar.tsx` — remove `token` arg from `getWallets()` call
- [ ] Task: Update test files for consumer components
    - [ ] Update mocks in component test files to mock axios instead of the old API helpers
    - [ ] Verify all component tests still pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Update Consumer Components' (Protocol in workflow.md)

## Phase 4: Final Verification & Cleanup

- [ ] Task: Run full test suite and verify coverage
    - [ ] Run `CI=true npm test` from the client directory
    - [ ] Verify all tests pass
    - [ ] Verify code coverage meets the >80% threshold
- [ ] Task: Run linting and type checking
    - [ ] Run linter on changed files
    - [ ] Run TypeScript type checking (`npx tsc --noEmit`)
    - [ ] Fix any issues found
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Final Verification & Cleanup' (Protocol in workflow.md)
