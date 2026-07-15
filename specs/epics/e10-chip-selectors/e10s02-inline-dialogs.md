# e10s02 — Inline Dialogs for Chip-List Management

**type:** feat
**risk:** P1
**context:** ui

## §1 Business Narrative

With the chip-list selectors in place (e10s01), users can visually identify and
select wallets/categories. But if they realize mid-entry that they need to
create a new wallet, edit a wallet's name, or browse all categories, they still
must abandon the form. This story adds inline management dialogs that slide over
the transaction form — long-press to edit, "+" to create, "View All" for a grid
browser. The transaction draft is never lost.

## §2 Actors

- **Primary user** — any authenticated user in the TransactionForm.

## §3 Trigger

- User long-presses (touch) or right-clicks (desktop) a chip → edit dialog.
- User taps the "+" button at the end of a chip row → creation dialog.
- User taps the "View All" button at the end of a chip row → grid modal.

## §4 Preconditions

- e10s01 is complete (WalletSelectList and CategorySelectList render and
  accept selection props).
- User is authenticated.
- API modules (`api/wallets.ts`, `api/categories.ts`) are available.

## §5 Happy Path

### Edit wallet

1. User opens Add Transaction dialog, sees wallet chips.
2. User long-presses a wallet chip → inline Dialog opens with full wallet form
   (name, description, color) prefilled with current values.
3. User edits the name and taps Save.
4. Dialog closes; the wallet list refreshes showing the updated name.
5. TransactionForm values are preserved (amount, description, selected category).

### Create wallet

1. User taps "+" at the end of the wallet row.
2. Inline Dialog opens with full wallet creation form (all fields empty,
   default color).
3. User fills name and taps Save.
4. Dialog closes; wallet list refreshes with the new wallet.
5. TransactionForm values preserved.

### View All wallets

1. User taps "View All" (grid icon) at the end of the wallet row.
2. Dialog opens with a compact CSS grid of wallet badges (same visual style).
3. User taps a wallet in the grid → selection is applied, modal closes.
4. Selected wallet is now highlighted in the chip list.

### Same flows for categories (edit, create, view all)

## §6 Alternative Flows

- **Desktop (no touch):** Right-click on chip opens a context menu with "Edit"
  option. Alternatively, a small pencil icon appears on hover.
- **Cancel dialog:** User opens edit/create dialog and clicks Cancel/outside →
  no changes, chip list unchanged.
- **API error in dialog:** Error message shown inside the dialog; form stays
  open for retry.

## §7 Error States

- Edit/create API call fails → ApiError message displayed in dialog.
- Wallet/category deleted by another session → list refresh shows new state.
- Network offline → API call fails with network error message.

## §8 Security Considerations

- **low** — dialogs reuse existing `createWallet`, `updateWallet`,
  `createCategory`, `updateCategory` API functions which already enforce
  authentication and ownership validation server-side.
- No new API surface.

## §9 Performance

- Dialog forms use react-hook-form same as existing WalletForm/CategoryForm.
- Grid modal renders up to ~50 items — grid layout, no virtualization needed.
- List refresh after create/update re-fetches via existing `getWallets()`/
  `getCategories()` (same calls used by Home.tsx, already fast).

## §10 Accessibility

- Dialogs use shadcn/ui Dialog with focus trap and Escape-to-close.
- Long-press is supplemented by keyboard alternative: focus chip + press
  Enter opens edit (same as keyboard selection in e10s01 plus Enter for edit).
- "+" and "View All" buttons are keyboard-focusable with visible focus rings.
- Grid modal items are keyboard-navigable (Tab through grid, Enter to select).

## §11 Internationalization

- Dialog labels reuse existing form labels from WalletForm/CategoryForm.
- No new translatable strings beyond button labels ("Edit", "Create", "View All").

## §12 Dependencies

- **shadcn/ui Dialog** (existing) — `[OK]` — already used in TransactionForm
  and TransactionDetailDialog.
- **shadcn/ui ContextMenu** (existing) — `[OK]` — already in ui/ directory,
  used for desktop right-click alternative.
- **shadcn/ui Badge** (new in e10s01) — `[OK]` — used for grid modal wallet
  items.
- **react-hook-form** (existing) — `[OK]` — used for inline edit/create forms.
- All API modules (existing) — `[OK]` — `api/wallets.ts`, `api/categories.ts`.

## §13 Telemetry

- Not applicable.

## §14 Backward Compatibility

- Existing `onCreateWallet`, `onCreateCategory`, `onViewWallet` props on
  TransactionForm are REMOVED (replaced by inline dialogs). Home.tsx callbacks
  for these props become dead code and are cleaned up.
- WalletSelectList and CategorySelectList API is extended: new `onRefresh`
  callback prop tells parent to re-fetch data.
- No server or database changes.

## §15 Rollback

- Remove dialog-handling code from WalletSelectList/CategorySelectList.
- Restore `onCreateWallet`/`onCreateCategory`/`onViewWallet` props and their
  text links in TransactionForm.

## §16 Related Documents

- `specs/planning-context.yaml`
- `specs/product/SCOPE_LATEST.yaml`
- `specs/epics/e10-chip-selectors/e10s01-chip-selectors.md`

## §17 Acceptance Criteria (Gherkin)

```gherkin
Feature: Inline Dialogs for Chip-List Management

  Scenario: Edit wallet via long-press
    Given the wallet chip list shows wallet "Cash" (green)
    When the user long-presses the "Cash" chip
    Then an edit dialog opens with "Cash" prefilled in the name field
    And the color field shows green
    When the user changes the name to "Petty Cash" and taps Save
    Then the dialog closes
    And the wallet chip now shows "Petty Cash"

  Scenario: Create wallet via "+" button
    Given the wallet chip list has a "+" button at the end
    When the user taps the "+" button
    Then a creation dialog opens with empty fields and default color
    When the user fills name "Savings" and taps Save
    Then the dialog closes
    And "Savings" appears as a new chip in the wallet list

  Scenario: View All wallets grid modal
    Given the wallet chip list has a "View All" button
    And the user has 5 wallets but only 3 fit in the scroll viewport
    When the user taps "View All"
    Then a grid modal opens showing all 5 wallets as colored badges
    When the user taps the 5th wallet
    Then the modal closes and that wallet is selected in the chip list

  Scenario: Edit category via long-press
    Given the category chip list shows category "Food" (red, UtensilsCrossed)
    When the user long-presses the "Food" chip
    Then an edit dialog opens with "Food", type "expense", red color, and
      UtensilsCrossed icon all prefilled
    When the user changes the color to orange and taps Save
    Then the dialog closes and the "Food" icon now renders in orange

  Scenario: Create category via "+" button
    Given the category chip list has a "+" button
    When the user taps "+"
    Then a creation dialog opens with empty fields, default "expense" type,
      default green color, and default Tag icon
    When the user fills name "Rent", sets type "expense", picks Home icon,
      and taps Save
    Then the "Rent" category appears as a chip with the Home icon

  Scenario: Desktop right-click to edit
    Given the user is on desktop (no touch)
    When the user right-clicks a wallet chip
    Then a context menu appears with "Edit" option
    When the user clicks "Edit"
    Then the edit dialog opens

  Scenario: Cancel dialog
    Given an edit dialog is open for wallet "Cash"
    When the user presses Escape or clicks outside the dialog
    Then the dialog closes with no changes applied
    And the wallet chip still shows "Cash"

  Scenario: Transaction form state preserved
    Given the user has filled "42.50" in amount and "Lunch" in description
    When the user opens and closes the wallet creation dialog
    Then the amount field still shows "42.50"
    And the description field still shows "Lunch"
```

## §18 Out of Scope

- Drag-to-reorder chip lists.
- Inline deletion of wallets/categories (existing delete flows remain on
  management pages).
- Transfer form dialog changes.
- Inline editing of transaction fields (beyond what was done in e09).

## §19 Implementation Notes

### Long-press detection

Use a custom hook `useLongPress(callback, ms = 600)` that combines
`onPointerDown` + `onPointerUp` with a timeout. If the pointer is held
for 600ms without moving >10px, fire the callback.

### Edit/Create dialog forms

Extract form field components from WalletForm.tsx and CategoryForm.tsx into
shared sub-components (`WalletFormFields`, `CategoryFormFields`) that can be
rendered inside either the page or an inline Dialog. This avoids duplicating
form logic.

Alternative (simpler, preferred): copy the form JSX inline into the dialog
components, since the form logic is ~30 lines each. Extract only if the
duplication becomes a maintenance burden.

### View All grid modal

A Dialog with a CSS grid (`grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))`)
showing Badge components for wallets or icon buttons for categories.
Each item has `onClick` that calls `onSelect` and closes the modal.

### Desktop alternative

Use the existing shadcn/ui ContextMenu component. Trigger: `onContextMenu`
on each chip. Menu has one item: "Edit". The "+" and "View All" buttons work
identically on desktop and mobile.

### Refreshing the list after mutation

WalletSelectList and CategorySelectList receive an `onRefresh` callback prop.
After a successful create/update API call in the dialog, call `onRefresh()`.
The parent (TransactionForm) refetches data via the same useEffect that
initially loaded it, or via a callback from Home. Actually: TransactionForm
already has the wallets/categories as props from Home. Add an `onRefresh`
prop to TransactionForm that Home wires to its existing `load()` function.

Cleaner alternative: make WalletSelectList/CategorySelectList call
`getWallets()`/`getCategories()` directly after mutation, then call
`onRefresh()` which causes the parent to re-render with fresh data.
The list refresh is a local state update, not a full page reload.

## §20 Verification Checklist

- [ ] `npm run type-check` passes
- [ ] `npx vitest run client/src/components/WalletSelectList.test.tsx` passes
- [ ] `npx vitest run client/src/components/CategorySelectList.test.tsx` passes
- [ ] `npx vitest run client/src/components/TransactionForm.test.tsx` passes
- [ ] Manual: long-press a wallet chip → edit dialog opens prefilled
- [ ] Manual: tap "+" on wallet row → create dialog opens
- [ ] Manual: tap "View All" → grid modal opens, tap item → selection applied
- [ ] Manual: long-press a category chip → edit dialog opens prefilled
- [ ] Manual: desktop right-click → context menu with "Edit"
- [ ] Manual: TransactionForm fields preserved after dialog open/close
- [ ] `npm test` passes with >=80% coverage
