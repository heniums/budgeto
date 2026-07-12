# Track Spec: User Sign-Up, Sign-In & Profile Management (Auth Pages)

## Overview
This track delivers the core authenticated user experience for Budgeto: a Sign Up page, a Sign In page, and a Profile Management page. It builds on the existing auth backend from the archived "Scaffold + Auth" track (reusing its API). The landing page is explicitly out of scope. UI is built with React as a PWA, prioritizing accessibility (WCAG AA), a friendly conversational tone, and mobile/installable responsiveness.

## Functional Requirements

### FR1 — Sign Up
- A public `/signup` page with a form: display name, email, password, confirm password.
- Client-side validation (required fields, email format, password length >= 8, passwords match) with inline field-level error messages.
- On submit, call the existing auth signup API; on success, authenticate the session and redirect to `/account/profile`.
- On API error (e.g., email in use), show an inline message near the relevant field.
- Link to `/login` for existing users.

### FR2 — Sign In
- A public `/login` page with email + password fields.
- Client-side validation with inline messages.
- On submit, call the existing auth login API; on success, redirect to `/account/profile`.
- On failure, show an inline error near the password field.
- Link to `/signup`.

### FR3 — Profile Management (`/account/profile`)
- Auth-guarded route: unauthenticated users are redirected to `/login`.
- Display current display name; allow editing the display name (inline-save with validation).
- Change-password form: current password, new password (>=8 chars), confirm new password, with inline validation/error messages.
- A minimal sign-out action (top-level nav/button) that clears the session and returns to `/login`.

### FR4 — Routing & Guards
- Public routes: `/signup`, `/login`.
- Guarded route: `/account/profile` (and any `/account/*`).
- Unauthenticated access to a guarded route redirects to `/login`, then back after auth.

### FR5 — Shared UX
- Inline, field-level validation and error messaging on all forms.
- Conversational, encouraging microcopy (e.g., "Welcome back!" / "Nice, you're all set.").
- Calm green/blue palette consistent with product branding.

## Non-Functional Requirements
- **Accessibility (WCAG AA):** sufficient contrast, full keyboard navigation, properly labeled inputs/controls; meaning not conveyed by color alone.
- **Mobile / PWA:** responsive layouts for web and Android; installable; core views usable offline.
- **Type Safety:** TypeScript throughout; forms typed.
- **Testability:** components structured for unit testing (TDD per workflow).

## Acceptance Criteria
- A new user can sign up (name, email, password), is authenticated, and lands on `/account/profile`.
- An existing user can sign in and reach `/account/profile`.
- Visiting `/account/profile` while logged out redirects to `/login`.
- A user can update their display name and see it persisted.
- A user can change their password and subsequently sign in with the new password.
- All forms show inline validation/error messages and are keyboard-navigable with sufficient contrast.
- Pages are responsive and installable as a PWA.

## Out of Scope
- Landing/marketing page.
- Email verification / password-reset flows.
- Social/SSO login.
- Account deletion.
- Email address change (name + password only in this track).
