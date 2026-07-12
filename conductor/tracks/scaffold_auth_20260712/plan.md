# Implementation Plan: Scaffold + Auth

> Source of truth for this track. Follow the workflow in `conductor/workflow.md` (TDD, >80% coverage, per-task commits, phase checkpoints).

## Phase 1: Project Scaffolding [checkpoint: ed0cb28]

- [x] Task: Set up project structure and tooling
    - [x] Write a smoke/health-check test that fails before the app exists
    - [x] Implement the base project layout (package.json, tsconfig, client/server folders, dev scripts)
- [x] Task: Configure PostgreSQL connection and ORM
    - [x] Write a test asserting the DB client connects and the initial migration runs
    - [x] Implement DB connection module and initial migration (users table)
- [x] Task: Establish code style and CI-aware dev commands
    - [x] Write a config-validation test asserting lint/type-check/test scripts and style configs exist
    - [x] Implement lint, type-check, and test scripts; apply the selected style guides
- [x] Task: Add PWA foundation (manifest + service worker)
    - [x] Write a test asserting the web manifest is served
    - [x] Implement web manifest and service worker registration
- [x] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding' (Protocol in workflow.md)

## Phase 2: Authentication [checkpoint: ed0cb28]

- [x] Task: Implement user registration
    - [x] Write failing tests for registration (valid input, invalid input, duplicate email)
    - [x] Implement registration endpoint with securely hashed passwords
- [x] Task: Implement user login and session
    - [x] Write failing tests for login (valid credentials, wrong password, unknown user)
    - [x] Implement login issuing a token/session
- [x] Task: Protect routes/endpoints
    - [x] Write failing tests asserting protected resources reject unauthenticated requests
    - [x] Implement auth middleware/guard for API endpoints (and UI routes as they appear)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Authentication' (Protocol in workflow.md)
