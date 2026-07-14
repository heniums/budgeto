# Story e08s04 — Stacked Modal Transitions with Form State Preservation

**Maturity:** 3
**Type:** feat
**Risk:** P1
**Context:** When filling out the Add Transaction form, the user may realize they
need to create a wallet or category first. Currently, they must close the form,
navigate to Settings, create the resource, then return and start the form over.
This story implements stacked modal transitions: the transaction form slides out,
the wallet/category creation form slides in, and when done, slides back with the
transaction form's field values intact.

**Zoom-out — client/src/pages/Home.tsx:**

- Purpose: Manages dialog state for Add Transaction and Transfer.
- Callers: router.tsx.
- Contracts: Dialog open/close state managed via `useState`. Add Transaction and Transfer are separate Dialogs with their own open states.

**Zoom-out — client/src/components/TransactionForm.tsx:**

- Purpose: Controlled form for creating a transaction.
- Callers: Home dialog.
- Contracts: Receives `wallets` prop and `onSuccess` callback. Uses react-hook-form with zodResolver. Form state lives in useForm hook.

## Requirements

### MODIFIED: Home dialog pattern supports stacked modals

**Before:** Add Transaction, Transfer, and any wallet/category actions each had their own independent Dialog with binary open/closed state.
**After:** A single stacked-modal container manages the current view ("transactionForm" | "transferForm" | "walletDetail" | "categoryDetail" | "walletCreate" | "categoryCreate" | null). Only one view is visible at a time; transitions use CSS slide animations.

### MODIFIED: TransactionForm stays mounted during sub-view navigation

**Before:** The TransactionForm was conditionally rendered inside `<Dialog open={txOpen}>`. Closing the dialog unmounted the form, discarding all field values.
**After:** The form is always rendered inside a container div. Visibility is controlled via CSS (`display: none` or `visibility: hidden` + opacity) rather than conditional rendering. When the wallet/category view slides in, the form slides out but remains mounted.

### ADDED: CSS slide transition animation

- The stacked modal container uses `transform: translateX()` transitions (or opacity + scale for a simpler approach).
- "Slide out": current view translates left/right and fades.
- "Slide in": new view translates in from the opposite direction.
- Duration: 200–300ms (CSS transition, no JS animation library needed).
- Tailwind `transition-transform` + `duration-200` utilities.

### ADDED: Auto-select newly created resource

- When a wallet is created via the stacked modal and the user returns to the transaction form, the wallet dropdown auto-selects the newly created wallet.
- When a category is created, the category field auto-selects it.
- Implementation: pass a callback `onResourceCreated(resource: { id: string, name: string })` from the transaction form to the wallet/category creation view. On creation, the callback sets the form field value via `setValue` from react-hook-form.

### ADDED: "Create wallet" / "Create category" links in TransactionForm

- Below the wallet `<select>`, add a small link: "Don't see your wallet? Create one →".
- Below the category field (added in e08s01), add: "Don't see your category? Create one →".
- Clicking these triggers the stacked modal transition to the creation view.
- These replace/coexist with the inline prerequisite warnings from e08s02.

## Acceptance Criteria (§17 — Gherkin)

```gherkin
Feature: Stacked modal transitions
  Scenario: Transaction form slides out when creating a wallet
    Given the Add Transaction dialog is open with fields partially filled
    When they click "Create wallet"
    Then the transaction form slides out and the wallet creation form slides in

  Scenario: Returning to transaction form preserves field values
    Given the wallet creation form is open (transaction form hidden)
    When they create a wallet or cancel
    Then the transaction form slides back in with all fields still filled

  Scenario: Newly created wallet is auto-selected
    Given the wallet creation form
    When they create a wallet named "Savings"
    Then the transaction form shows "Savings" selected in the wallet dropdown

  Scenario: Newly created category is auto-selected
    Given the category creation form
    When they create a category named "Groceries"
    Then the transaction form shows "Groceries" in the category field

  Scenario: Cancel returns to form without changes
    Given the wallet creation form
    When they click Cancel
    Then the transaction form slides back with original field values and no wallet is created
```

## Out of Scope

- Animating the dialog container itself (size change during transition).
- URL-based state for stacked modals (no route changes).
- Undo/redo of stacked modal navigation.

## Risks

- **Form state leakage**: If the transaction form is accidentally unmounted (e.g., React reconciliation), field values are lost. Mitigation: use `React.useRef` to persist form values as a backup, or store in a context.
- **CSS animation jank on mobile**: `transform: translateX()` can cause layout shifts on narrow viewports. Fallback: use opacity + scale instead, which is GPU-accelerated.
- **Deep stacking**: User could theoretically stack wallet create → category create → wallet detail. Keep the stack depth to 2 (transaction form + one sub-view) to avoid complexity.
