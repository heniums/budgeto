# Story e06s04 — Settings: Wallets / Categories / User tabs

**Maturity:** 3
**Type:** refactor
**Risk:** P1
**Context:** Settings is a single page with three shadcn `Tabs`: Wallets (reuses existing wallet list/detail/form logic + API), Categories (reuses existing categories page/form/API), and User (reuses existing Profile: name/email/password). Dashboard is removed; wallet/category/profile management consolidates here.

## Requirements

### ADDED: Settings hub page
- Route `/settings` renders a Tabs container with Wallets, Categories, User.

### MODIFIED: Management surfaces relocated
- **Before:** Wallets managed via /wallets + /wallets/:id; Categories via /account/categories*; User via /profile.
- **After:** All three live as tabs within /settings, reusing existing components/APIs (Wallets tab, Categories tab, User tab).

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: Settings hub
  Scenario: Three tabs present
    Given an authenticated user on /settings
    Then they see Wallets, Categories, and User tabs

  Scenario: Wallets tab manages wallets
    Given the Wallets tab
    When they add/edit/delete a wallet
    Then it persists via the existing wallets API

  Scenario: User tab updates profile
    Given the User tab
    When they change their name/email/password
    Then it persists via the existing auth/profile API
```

## Out of Scope
- New wallet/category/profile features — reuse only.
- Home transactions list (e06s03).

## Risks
- Reused components may still import removed routes/paths — fix imports during relocation.
