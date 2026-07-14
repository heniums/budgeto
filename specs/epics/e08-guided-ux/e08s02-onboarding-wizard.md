# Story e08s02 — Onboarding Wizard + Empty-State Guidance

**Maturity:** 3
**Type:** feat
**Risk:** P0
**Context:** A new user lands on Home and sees "No transactions found" with no
path forward. The wizard guides them through wallet → category → transaction
creation. For returning users who dismissed the wizard but still lack
prerequisites, conditional empty-state prompts fill the gap.

**Zoom-out — client/src/pages/Home.tsx:**

- Purpose: Main landing page — transaction list, filters, add/transfer dialogs.
- Callers: router.tsx (as route element under Layout > Outlet).
- Contracts: Must be a React component returning JSX.Element. No props — self-fetching.

## Requirements

### ADDED: OnboardingWizard component

- A 3-step dialog/sheet using shadcn components:
  1. **Create Wallet** — renders the wallet creation form (same component used in Settings > Wallets tab). On success, auto-advances to step 2.
  2. **Create Category** — renders the category creation form (same component used in Settings > Categories tab). On success, auto-advances to step 3.
  3. **Add Transaction** — renders the TransactionForm (e08s04 provides stacked modal transitioan). On success, wizard closes and Home refreshes.
- Each step shows a progress indicator ("Step 1 of 3").
- Dismissable via X button (top-right). On dismiss, stores `budgeto:wizardDismissed` = "true" in localStorage.
- Re-triggerable from the user menu (add "Start setup" item to the user dropdown or Settings > User tab).

### ADDED: Wizard trigger logic in Home.tsx

- On Home mount, after wallets load: if `wallets.length === 0` AND `localStorage.getItem('budgeto:wizardDismissed') !== 'true'`, show the OnboardingWizard instead of the transaction table.
- The wizard takes the full content area; no table or filters visible behind it.
- On wizard completion/dismissal, Home renders normally (transaction table or empty state).

### ADDED: Conditional empty-state prompts

- When `wallets.length === 0` (wizard was dismissed or user deleted all wallets):
  - Show: "You have no wallets yet" with a CTA button "Create your first wallet" that opens the Create Wallet dialog.
- When `wallets.length > 0 && categories.length === 0`:
  - Show: "You have no categories yet" with a CTA button "Create your first category" that opens the Create Category dialog.
- When both wallets and categories exist but transactions are empty:
  - Show the current "No transactions found" message, but add a "Add your first transaction" CTA button that opens the Add Transaction dialog.

### ADDED: Inline prerequisite warnings in TransactionForm

- If `wallets.length === 0`, disable the submit button and show: "You need a wallet to add a transaction. Create one →" (link opens wallet creation).
- If `categories.length === 0` and wallets exist, show: "You have no categories yet. Create one →" (link opens category creation). Do not disable submit — categories are optional.

## Acceptance Criteria (§17 — Gherkin)

```gherkin
Feature: Onboarding wizard
  Scenario: First visit shows wizard
    Given a new user with zero wallets
    And wizardDismissed is not set in localStorage
    When they open Home
    Then the 3-step onboarding wizard is shown instead of the transaction table

  Scenario: Wizard guides through wallet → category → transaction
    Given the wizard is open at step 1
    When they create a wallet
    Then the wizard advances to step 2 (create category)
    When they create a category
    Then the wizard advances to step 3 (add transaction)
    When they submit the transaction
    Then the wizard closes and Home shows the new transaction

  Scenario: Dismissed wizard stays hidden
    Given the wizard was dismissed
    When they revisit Home
    Then the wizard is not shown; the empty-state prompt is shown instead

  Scenario: Re-trigger wizard from user menu
    Given a returning user who dismissed the wizard
    When they click "Start setup" in the user menu
    Then the wizard re-opens

  Scenario: Empty state when no wallets
    Given a returning user with zero wallets
    When they view Home
    Then they see "You have no wallets yet — create your first wallet" with a CTA

  Scenario: Empty state when no categories
    Given a user with wallets but zero categories
    When they view Home
    Then they see "You have no categories yet — create your first category" with a CTA

  Scenario: TransactionForm warns about missing prerequisites
    Given a user with zero wallets
    When they open the Add Transaction dialog
    Then the submit button is disabled with a "Create wallet" link
```

## Out of Scope

- Analytics tracking on wizard completion rates.
- Skip/back buttons within wizard steps (only X dismiss + auto-advance).
- Wizard that detects partially-complete state (e.g., wallets exist but no categories — that's the empty-state prompt, not the wizard).

## Risks

- **localStorage dependency**: If localStorage is unavailable (private browsing, storage full), wizard may show on every visit. Mitigation: wrap in try/catch, default to hidden if storage fails.
- **Component reuse tight coupling**: The wizard reuses wallet/category creation forms from Settings. If those forms change, the wizard must be updated. Keep form props consistent.
- **Race condition**: If wallets/categories load slowly, Home might flash the empty state before data arrives. Use loading state to gate rendering.
