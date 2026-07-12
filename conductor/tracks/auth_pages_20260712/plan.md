# Implementation Plan: User Sign-Up, Sign-In & Profile Management

> **Backend note:** The existing "Scaffold + Auth" backend supports `/auth/register` (email+password only, no name), `/auth/login`, and `/auth/me` (returns id/email only). To fulfill this spec, this plan *extends* (not replaces) that API: adds a `name` column, profile read/update, and change-password endpoints. Frontend builds UI on these.

## Phase 1 — Backend: Extend Auth API (Name & Profile)
- [x] Task: Add `name` to the user model (11867d2)
    - [x] Write failing tests for schema/repository storing and returning `name`
    - [x] Implement `name` column in `db/schema.ts`, migration, and `createUser`/`register` to accept & persist `name`; register returns `name`
- [ ] Task: Profile read/update endpoint
    - [ ] Write failing tests for `GET /auth/me` (returns name) and `PATCH /auth/me` (updates name, auth-guarded)
    - [ ] Implement controller/service/route for `GET`/`PATCH /auth/me` handling `name`
- [ ] Task: Change-password endpoint
    - [ ] Write failing tests for `POST /auth/change-password` (verifies current password, rejects wrong, sets new)
    - [ ] Implement change-password service, controller, and route (auth-guarded)
- [ ] Task: Conductor - User Manual Verification 'Phase 1 — Backend: Extend Auth API (Name & Profile)' (Protocol in workflow.md)

## Phase 2 — Frontend Foundation: Session, API Client, Routing & Guards
- [ ] Task: Auth/session context
    - [ ] Write failing tests for session provider (stores token, loads current user via `/auth/me`, exposes logout)
    - [ ] Implement React context: token persistence (localStorage), `useAuth()` hook, current user fetch
- [ ] Task: Typed auth API client
    - [ ] Write failing tests for API client functions (register, login, getMe, updateName, changePassword) mocking fetch
    - [ ] Implement typed client calling the auth endpoints
- [ ] Task: Router with public & guarded routes
    - [ ] Write failing tests for route guards (unauthenticated `/account/profile` redirects to `/login`; post-login redirect)
    - [ ] Implement React Router: `/signup`, `/login` public; `/account/profile` guarded; redirect logic
- [ ] Task: Conductor - User Manual Verification 'Phase 2 — Frontend Foundation' (Protocol in workflow.md)

## Phase 3 — Sign Up Page
- [ ] Task: SignUp form component
    - [ ] Write failing tests for validation (required, email format, password >=8, match) + inline error display
    - [ ] Implement SignUp page: name, email, password, confirm; inline validation; submit -> API -> redirect `/account/profile`
- [ ] Task: Conductor - User Manual Verification 'Phase 3 — Sign Up Page' (Protocol in workflow.md)

## Phase 4 — Sign In Page
- [ ] Task: SignIn form component
    - [ ] Write failing tests for validation + inline error on invalid credentials
    - [ ] Implement SignIn page: email/password, inline validation, submit -> API -> redirect `/account/profile`
- [ ] Task: Conductor - User Manual Verification 'Phase 4 — Sign In Page' (Protocol in workflow.md)

## Phase 5 — Profile Management Page
- [ ] Task: Display & edit display name
    - [ ] Write failing tests for name display + inline edit/save with validation
    - [ ] Implement profile view + inline name editing calling `PATCH /auth/me`
- [ ] Task: Change-password form
    - [ ] Write failing tests for change-password validation (current, new >=8, confirm) + inline errors
    - [ ] Implement change-password form calling `POST /auth/change-password`
- [ ] Task: Sign-out action
    - [ ] Write failing tests for sign-out clearing session and navigating to `/login`
    - [ ] Implement sign-out button (clear token, redirect)
- [ ] Task: Conductor - User Manual Verification 'Phase 5 — Profile Management Page' (Protocol in workflow.md)

## Phase 6 — Shared UX & Accessibility Polish
- [ ] Task: Conversational microcopy & branding
    - [ ] Write failing tests / lint for microcopy presence and palette tokens
    - [ ] Implement friendly copy ("Welcome back!", "Nice, you're all set.") and calm green/blue theme
- [ ] Task: Accessibility & responsive/PWA
    - [ ] Write failing tests for labeled inputs, keyboard nav, focus management
    - [ ] Implement WCAG AA (contrast, labels, keyboard) + responsive layouts; verify PWA installability/offline
- [ ] Task: Conductor - User Manual Verification 'Phase 6 — Shared UX & Accessibility Polish' (Protocol in workflow.md)
