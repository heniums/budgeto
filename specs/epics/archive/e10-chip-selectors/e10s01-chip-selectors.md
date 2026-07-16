# e10s01 — Wallet & Category Chip-List Selectors in TransactionForm

**type:** feat
**risk:** P1
**context:** ui

## §1 Business Narrative

Users creating a transaction currently pick a wallet and category from plain HTML
`<select>` dropdowns that show only text names. This hides the visual identity
(colors, icons) established elsewhere in the app and offers no inline management
path — users must abandon the form to create or edit a wallet/category.

This story replaces both dropdowns with horizontally scrollable chip-list
components. Wallet chips appear as colored badges (border + text). Category
chips show the icon rendered in the category's color. Tapping a chip selects
it. This is the tracer-bullet slice: it proves the selection pattern works
before adding inline dialogs (e10s02).

## §2 Actors

- **Primary user** — any authenticated user adding or editing a transaction
  in the TransactionForm dialog.

## §3 Trigger

User opens the "Add transaction" or "Edit transaction" dialog.

## §4 Preconditions

- User is authenticated.
- User has at least one wallet (or sees empty-state prompt).
- User may have zero or more categories.

## §5 Happy Path

1. User opens the Add Transaction dialog.
2. Wallet row shows a horizontally scrollable list of wallet badges (name in
   colored border/text).
3. User taps a wallet badge → it becomes visually selected (filled variant).
4. Category row shows a horizontally scrollable list of category icons (icon
   glyph in the category's color).
5. User taps a category icon → it becomes visually selected.
6. User fills amount and description, taps "Add Transaction".
7. Transaction is created with the selected wallet and category IDs.

## §6 Alternative Flows

- **No wallets:** Wallet row shows empty-state message "No wallets yet"
  (existing prompt unchanged from current TransactionForm).
- **No categories:** Category row hidden — the existing "You have no categories"
  prompt in TransactionForm remains intact.
- **Many items:** Row scrolls horizontally; user can swipe/scroll to see all.
- **Edit mode:** Existing edit flow unchanged — only the selection UI changes.

## §7 Error States

- Wallet list fetch fails → existing error handling applies (wallet data is
  fetched by TransactionForm's parent, Home.tsx).
- Category list fetch fails → same as above.

## §8 Security Considerations

- **none** — no new API surface; selection emits existing walletId/categoryId
  values to the parent form.

## §9 Performance

- Renders up to ~50 wallet/category chips in a horizontal ScrollArea.
- Icon resolution uses the existing `getIcon()` lookup (O(n) over 26 icons —
  negligible).
- No virtualization needed at expected list sizes.

## §10 Accessibility

- Chip list is keyboard-navigable: ArrowLeft/ArrowRight to move focus, Enter/Space
  to select.
- Selected chip has `aria-pressed="true"` and visible focus ring.
- ScrollArea is focusable and scrollable via arrow keys when focused.

## §11 Internationalization

- No new user-facing strings beyond component labels (same as existing).

## §12 Dependencies

- **shadcn/ui Badge** (new) — `[OK]` — mature, already used via the shadcn/ui
  ecosystem in this project. Install: `npx shadcn-ui add badge`.
- **shadcn/ui ScrollArea** (new) — `[OK]` — mature, part of shadcn/ui.
  Install: `npx shadcn-ui add scroll-area`.
- **lucide-react** (existing) — `[OK]` — already in project, used by `lib/icons.ts`.
- **react-hook-form** (existing) — `[OK]` — already used by TransactionForm.
  Chip lists integrate via `Controller` or `setValue`.

## §13 Telemetry

- Not applicable (no analytics in project).

## §14 Backward Compatibility

- `TransactionForm` props (`onCreateWallet`, `onCreateCategory`, `onViewWallet`)
  remain in the interface for Home.tsx compatibility. They are rendered as
  supplementary text links below the chip lists (same as current behavior).
- `WalletData` and `CategoryData` types unchanged.
- Form submit logic unchanged — the same `walletId`/`categoryId` values are
  submitted.

## §15 Rollback

- Reverting the TransactionForm select elements to `<select>` is a single-file
  undo (TransactionForm.tsx). WalletSelectList and CategorySelectList components
  can be deleted.

## §16 Related Documents

- `specs/planning-context.yaml`
- `specs/product/SCOPE_LATEST.yaml`
- `specs/release-plan.yaml`
- `specs/tech-architecture/TECH_STACK_LATEST.md`

## §17 Acceptance Criteria (Gherkin)

```gherkin
Feature: Chip-List Selectors in TransactionForm

  Scenario: Select a wallet via chip list
    Given the user has wallets "Cash" (green) and "Bank" (blue)
    And the user opens the Add Transaction dialog
    Then the wallet row shows two horizontally scrollable chips
    And the "Cash" chip has green border and "Cash" text
    And the "Bank" chip has blue border and "Bank" text
    When the user taps the "Cash" chip
    Then the "Cash" chip is visually selected (filled background)
    And the "Bank" chip is not selected

  Scenario: Select a category via chip list
    Given the user has categories "Food" (red, UtensilsCrossed icon) and "Car" (blue, Car icon)
    And the user opens the Add Transaction dialog
    Then the category row shows two horizontally scrollable icon chips
    And the "Food" chip shows the UtensilsCrossed icon in red
    And the "Car" chip shows the Car icon in blue
    When the user taps the "Car" chip
    Then the "Car" chip is visually selected
    And the previous selection (if any) is deselected

  Scenario: Submit transaction with chip-list selection
    Given the user selected wallet "Cash" and category "Food"
    When the user fills amount "42.50", description "Lunch", and submits
    Then the transaction is created with walletId="Cash" and categoryId="Food"

  Scenario: Keyboard navigation in chip list
    Given a wallet chip list with 3 wallets
    When the user tabs into the chip list and presses ArrowRight twice
    Then the third chip receives focus
    When the user presses Enter
    Then that chip is selected

  Scenario: Empty wallet state preserved
    Given the user has zero wallets
    When the user opens the Add Transaction dialog
    Then the existing "You need a wallet to add a transaction" alert is shown
    And no chip list is rendered
```

## §18 Out of Scope

- Inline edit/creation dialogs (e10s02).
- "View All" grid modal (e10s02).
- Desktop right-click alternatives (e10s02).
- Category type filtering (all types shown together per design decision).
- Changes to wallet/category management pages.
- Transfer form dialog.

## §19 Implementation Notes

- Wallet chips: `<Badge variant="outline" style={{ borderColor: color, color }}>{name}</Badge>`
  for unselected; `<Badge style={{ backgroundColor: color, color: '#fff' }}>` for selected.
- Category chips: render `getIcon(iconName)` at `size={20}` with `color` fill.
- Selection state managed in the parent TransactionForm via existing `setValue`.
- ScrollArea orientation="horizontal" with `className="flex gap-2"` for chip layout.
- Keyboard: `role="listbox"` with `role="option"` on chips, `aria-selected`.

## §20 Verification Checklist

- [ ] `npm run type-check` passes
- [ ] `npx vitest run client/src/components/WalletSelectList.test.tsx` passes
- [ ] `npx vitest run client/src/components/CategorySelectList.test.tsx` passes
- [ ] `npx vitest run client/src/components/TransactionForm.test.tsx` passes
- [ ] `npm test` passes with >=80% coverage
