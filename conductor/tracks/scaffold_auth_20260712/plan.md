# Implementation Plan: Scaffold + Auth

> Source of truth for this track. Follow the workflow in `conductor/workflow.md` (TDD, >80% coverage, per-task commits, phase checkpoints).

## Phase 1: Project Scaffolding

- [ ] Task: Set up project structure and tooling
    - [ ] Write a smoke/health-check test that fails before the app exists
    - [ ] Implement the base project layout (package.json, tsconfig, client/server folders, dev scripts)
- [ ] Task: Configure PostgreSQL connection and ORM
    - [ ] Write a test asserting the DB client connects and the initial migration runs
    - [ ] Implement DB connection module and initial migration (users table)
- [ ] Task: Establish code style and CI-aware dev commands
    - [ ] Write a config-validation test asserting lint/type-check/test scripts and style configs exist
    - [ ] Implement lint, type-check, and test scripts; apply the selected style guides
- [ ] Task: Add PWA foundation (manifest + service worker)
    - [ ] Write a test asserting the web manifest is served
    - [ ] Implement web manifest and service worker registration
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding' (Protocol in workflow.md)

## Phase 2: Authentication

- [ ] Task: Implement user registration
    - [ ] Write failing tests for registration (valid input, invalid input, duplicate email)
    - [ ] Implement registration endpoint with securely hashed passwords
- [ ] Task: Implement user login and session
    - [ ] Write failing tests for login (valid credentials, wrong password, unknown user)
    - [ ] Implement login issuing a token/session
- [ ] Task: Protect routes/endpoints
    - [ ] Write failing tests asserting protected resources reject unauthenticated requests
    - [ ] Implement auth middleware/guard for API endpoints (and UI routes as they appear)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Authentication' (Protocol in workflow.md)
