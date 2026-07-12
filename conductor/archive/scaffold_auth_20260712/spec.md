# Track Specification: Scaffold + Auth

## Track ID
`scaffold_auth_20260712`

## Type
Feature

## Status
New

## Description
Establish the Budgeto project foundation and implement basic authentication. This track delivers a runnable, code-style-compliant project skeleton plus the ability for a user to register and log in.

## Goals
1. **Project Scaffolding**
   - TypeScript codebase with a React PWA frontend and an Express backend.
   - PostgreSQL as the database, accessed via a TypeScript ORM/query layer.
   - Code style guides (`typescript.md`, `react.md`, `sql.md`, `general.md`) applied.
   - Development commands (setup, dev, test, lint, type-check) configured.
   - PWA foundation (manifest + service worker) so the app is installable on Android.

2. **Authentication**
   - User registration (email + password) with securely hashed credentials.
   - User login issuing a session/JWT token.
   - Protected routes/endpoints requiring authentication.
   - Basic auth-related tests and error handling.

## Scope (Out of Scope for this Track)
- Accounts/wallets management
- Expense categories and CRUD
- Dashboard and history views
- Budget definition

These are deferred to later tracks.

## Non-Functional Requirements
- Performance: key actions responsive (<200ms typical).
- Accessibility: WCAG AA in the UI.
- Data safety: passwords never stored in plaintext; no accidental data loss.

## Success Criteria
- `npm install` and `npm run dev` bring up the app.
- A new user can register and then log in successfully.
- Protected resources reject unauthenticated requests.
- Tests for auth pass; code follows the selected style guides.
