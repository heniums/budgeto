# Specification: Centralized HTTP Client with Axios

## Overview

Abstract the scattered, duplicated client-side HTTP request logic and token management into a single centralized axios-based HTTP client module. This eliminates code duplication, enforces consistent error handling, and simplifies the API surface by removing manual token passing.

## Current State

- The `request()` helper and `authHeader()` functions are copy-pasted between `client/src/api/auth.ts` and `client/src/api/wallets.ts`.
- Every API function accepts `token: string` as the first argument, requiring each consumer component to retrieve it from `useAuth().token` and pass it manually.
- There is no global error handling; each component manages its own error state.
- The API client relies solely on relative paths with a Vite dev proxy.
- No axios is currently installed.

## Functional Requirements

### FR-1: Axios Instance
- Install `axios` as a dependency.
- Create a pre-configured axios instance at `client/src/api/client.ts`.

### FR-2: Request Interceptor — Automatic Token Injection
- An axios request interceptor reads the auth token from `localStorage` (key: `budgeto.token`).
- If a token exists, it is attached as an `Authorization: Bearer <token>` header on every outgoing request.
- Consumers no longer need to pass `token` as a parameter to API functions.

### FR-3: Configurable Base URL
- Support a `VITE_API_BASE_URL` environment variable for the API base URL.
- When not set, default to an empty string (preserving relative-path behavior).
- Update `vite.config.ts` proxy configuration to remain functional.

### FR-4: Response Interceptor — Centralized Error Handling
- Successful responses pass through unchanged.
- On error responses:
  - Normalize the error body into an `ApiError` instance (message, status code, optional error code).
  - If the response status is `401 Unauthorized`, clear the auth token from localStorage and the in-memory auth state.
  - Re-throw the normalized `ApiError` so callers can still catch specific errors if needed.

### FR-5: Consolidate API Functions
- Refactor all exported functions in `client/src/api/auth.ts` and `client/src/api/wallets.ts` to use the new axios client.
- Remove the duplicated `request()` and `authHeader()` helper functions from both files.
- Remove the `token` parameter from all API function signatures.

### FR-6: Update Consumer Components
- Update all components that currently pass `token` to API functions to use the new parameter-less signatures.
- This includes: `AuthContext.tsx`, `Dashboard.tsx`, `WalletList.tsx`, `WalletDetail.tsx`, `WalletForm.tsx`, `Profile.tsx`, `TransactionForm.tsx`, `TransferForm.tsx`, `Sidebar.tsx`.

### FR-7: Existing Tests Must Pass
- All existing tests must continue to pass after the refactor.
- Test files that mock `fetch` should be updated to mock axios instead, or axios should be properly mocked in the test setup.

## Non-Functional Requirements

- **NFR-1:** The axios instance must be a singleton — the same instance is imported by all API modules.
- **NFR-2:** The `ApiError` class must retain its current interface to avoid breaking existing error-handling code.
- **NFR-3:** No new runtime dependencies beyond `axios`.

## Out of Scope

- Token refresh mechanism (JWT expiry handling beyond 401 response).
- Request retry logic.
- Request caching.
- Request/response logging.
- Upload progress tracking.
