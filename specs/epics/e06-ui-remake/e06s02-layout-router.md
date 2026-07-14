# Story e06s02 — Layout & Router: Home/Settings nav + mobile drawer

**Maturity:** 3
**Type:** refactor
**Risk:** P1
**Context:** The current `Sidebar` fetches wallets and lists them; the router exposes Dashboard, WalletList, WalletDetail, Categories, Profile, etc. This story rebuilds Layout/Sidebar and the router so the left nav has ONLY Home and Settings, Settings is a single route, and on mobile the sidebar collapses to a shadcn `Sheet` drawer.

## Requirements

### MODIFIED: Left navigation
- **Before:** Sidebar lists every wallet plus links to Dashboard/Wallets/Categories/Profile.
- **After:** Left nav shows only Home and Settings (user avatar + logout may accompany).

### ADDED: Mobile drawer
- Below a breakpoint, the sidebar is hidden and toggled via a hamburger that opens a shadcn `Sheet` drawer containing the same two nav items.

### MODIFIED: Router
- **Before:** Routes include /dashboard, /wallets, /wallets/:id, /account/categories, /account/categories/new, /account/categories/:id/edit, /profile.
- **After:** Routes are / (Home) and /settings (Settings hub). Old routes removed or redirected.

## Acceptance Criteria (§17 — Gherkin)
```gherkin
Feature: Navigation restructure
  Scenario: Desktop nav shows only Home and Settings
    Given an authenticated user on desktop
    When the app loads
    Then the left nav displays exactly Home and Settings

  Scenario: Mobile nav collapses to a drawer
    Given an authenticated user on a narrow viewport
    When they tap the menu button
    Then a drawer opens with Home and Settings links

  Scenario: Dashboard route is removed
    Given the old /dashboard URL
    When visited
    Then it redirects to / (Home) or 404s gracefully
```

## Out of Scope
- The Settings tab contents (e06s04).
- The Home transactions list (e06s03).

## Risks
- Removing old routes can break existing tests/imports — update router tests and any deep links.
