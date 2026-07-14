# Story e08s03 — Contextual Wallet/Category Access via Long-Press and Right-Click

**Maturity:** 3
**Type:** feat
**Risk:** P1
**Context:** Currently, editing a wallet or category requires navigating to
Settings > Wallets/Categories tab — a context switch away from the transaction
you were viewing. This story makes wallet names and category badges interactive:
right-click (desktop) or long-press (mobile) opens the detail/edit view inline,
using the same components from Settings.

**Slopcheck:**

- `@radix-ui/react-context-menu` [OK] — Radix primitive, same ecosystem as existing shadcn components. Installed via `npx shadcn add context-menu`.
- No other external dependencies.

**Zoom-out — client/src/pages/Home.tsx:**

- Purpose: Main landing page rendering the transaction table.
- Callers: router.tsx.
- Contracts: Must handle new interactive cell rendering (context menu wrappers) without changing the table structure.

**Zoom-out — client/src/components/TransactionForm.tsx / TransferForm.tsx:**

- Purpose: Creation forms for transactions/transfers.
- Callers: Home dialogs.
- Contracts: Receive `wallets: WalletData[]` prop and `onSuccess` callback. Must not regress form submission flow.

## Requirements

### ADDED: shadcn ContextMenu component

- Run `npx shadcn add context-menu` to add `client/src/components/ui/context-menu.tsx`.
- The component wraps Radix's `@radix-ui/react-context-menu` primitives with Tailwind styling.

### ADDED: Context menu on wallet name cells

- In the Home transaction table, wrap the Wallet column's cell content (wallet name) in a ContextMenu.
- Menu items: "View wallet details" → opens WalletDetailSheet.
- On desktop: triggered by right-click (native context-menu behavior).
- On mobile: triggered by long-press (touch-hold ≥ 500ms).

### ADDED: Context menu on category badge cells

- Same pattern for the Category column badges: wrap in ContextMenu.
- Menu item: "View category details" → opens CategoryDetailSheet.

### ADDED: Context menu on wallet/category selectors in forms

- In TransactionForm, the wallet `<select>` options gain a context menu trigger (icon or long-press on the selected wallet name).
- Menu item: "View wallet details" or "Create new wallet".
- Same for category selector (once category field is added to the form — see e08s01 for category data).

### ADDED: WalletDetailSheet component

- A shadcn Sheet (slide-over panel) that displays wallet details and an edit form.
- Reuses the wallet edit component from Settings > Wallets tab.
- Props: `walletId: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`, `onSuccess?: () => void`.
- Fetches wallet data on mount via `getWallet(id)`.
- On successful edit, fires `onSuccess` so the parent (Home or form) can refresh its data.

### ADDED: CategoryDetailSheet component

- Same pattern as WalletDetailSheet, but for categories.
- Props: `categoryId: string`, `open: boolean`, `onOpenChange`, `onSuccess`.
- Reuses the category edit component from Settings > Categories tab.

### ADDED: Mobile long-press handler

- For mobile (touch devices), implement a long-press handler with a 500ms threshold.
- On long-press, show the same actions as the context menu but in a shadcn DropdownMenu or bottom sheet.
- The handler is added to wallet name and category badge cells.

## Acceptance Criteria (§17 — Gherkin)

```gherkin
Feature: Contextual wallet/category access
  Scenario: Right-click wallet name opens detail sheet
    Given the Home transaction table with wallet names
    When the user right-clicks a wallet name
    Then a context menu appears with "View wallet details"
    When they select it
    Then a WalletDetailSheet slides in showing that wallet's details

  Scenario: Right-click category badge opens detail sheet
    Given the Home transaction table with category badges
    When the user right-clicks a category badge
    Then a context menu appears with "View category details"
    When they select it
    Then a CategoryDetailSheet slides in

  Scenario: Long-press on mobile opens action sheet
    Given the Home page on a touch device
    When the user long-presses a wallet name for 500ms
    Then an action sheet appears with "View wallet details"

  Scenario: Editing a wallet from the detail sheet refreshes Home
    Given the WalletDetailSheet is open
    When the user edits the wallet name and saves
    Then the sheet closes and the Home table refreshes with the updated name

  Scenario: Context menu works inside TransactionForm
    Given the TransactionForm is open with a wallet selected
    When the user right-clicks the selected wallet
    Then the context menu appears
```

## Out of Scope

- Creating a new wallet/category from the context menu (that's the stacked modal in e08s04).
- Bulk actions (delete, archive) from the context menu.
- Context menu on other UI elements (nav items, filters).

## Risks

- **@radix-ui/react-context-menu bundle size**: Adds ~3KB gzipped. Acceptable for the UX gain.
- **Mobile vs desktop detection**: Need to decide whether to always show context menu (right-click works everywhere) and add long-press as an ADDITIONAL trigger, or use device detection. Simpler: render ContextMenu always (handles right-click natively), add long-press as an additional trigger on all devices.
- **Sheet stacking**: If the user already has the Add Transaction dialog open, and opens a WalletDetailSheet from a context menu, we have two overlays. The stacked modal (e08s04) handles this ordering.
