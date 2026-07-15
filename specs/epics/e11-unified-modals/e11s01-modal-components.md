# e11s01 — Dialog-based Unified WalletModal & CategoryModal

## Story

Refactor `WalletModal` and `CategoryModal` from shadcn `Sheet` (slide-in
sidebar) to shadcn `Dialog` (centered popup). Remove the `mode` prop and
`internalMode` toggle — replace with a single unified view where form fields
are always editable, "Save Changes" enables on dirty detection, and "Delete"
is always visible.

## Design

### WalletModal refactor

**Current:** Uses `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`. Accepts
`mode: 'create' | 'edit' | 'view'` + `internalMode` for edit-from-view toggle.
Fetches wallet + transactions in view mode.

**New:** Uses `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`.

**Props (simplified):**

```ts
export interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string; // when provided: edit mode (fetch + prefill). When absent: create mode.
  onSuccess?: (wallet?: WalletData) => void;
}
```

**Unified view behavior:**

- If `walletId` is provided → fetch wallet on open, prefill form fields
- If `walletId` is absent → empty form (create mode)
- Form fields (name, description, color) are **always editable** — no read-only state
- `react-hook-form`'s `formState.isDirty` controls the "Save Changes" button: enabled only when dirty
- "Delete" button is always visible (when `walletId` is present)
- "Cancel" / "Close" button always visible
- No transaction list (form-only layout)
- On successful save/delete → calls `onSuccess()`, closes dialog
- Loading state: spinner or "Loading…" text while fetching wallet
- Error state: red alert banner at top

**Key state transitions removed:**

- `internalMode` — no more edit-from-view toggle
- `isCreate` / `isEdit` / `isView` computed booleans — replaced by simple `!!walletId`
- `effectiveMode` — removed entirely

**Create vs Edit distinction:**

- Create: `walletId` is undefined → submit calls `createWallet()`, button says "Create"
- Edit: `walletId` is defined → submit calls `updateWallet()`, button says "Save Changes" (enabled on dirty), delete calls `deleteWallet()`

### CategoryModal refactor

Same pattern as WalletModal:

```ts
export interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onSuccess?: (category?: CategoryData) => void;
}
```

- Form fields (name, type, color, icon) always editable
- `formState.isDirty` enables "Save Changes"
- "Delete" always visible when `categoryId` present
- Icon grid always interactive
- No separate read-only view section

### Shared changes

- Replace `Sheet` import with `Dialog` import
- Replace `SheetContent` with `DialogContent`
- Replace `SheetHeader`/`SheetTitle` with `DialogHeader`/`DialogTitle`
- Remove `SHEET_SIDE` and `SHEET_WIDTH` constants usage
- Dialog naturally centers on screen; width constrained by `max-w-lg` (default in DialogContent)

## Implementation Steps

**type:** refactor
**risk:** P1
**context:** infra
**Context:** Refactors WalletModal and CategoryModal from Sheet to Dialog with unified always-editable view. Touches 4 files (2 components + 2 test files). No API changes. Callers (Home.tsx, WalletList.tsx, Categories.tsx) updated in e11s03.

### Step 1: Refactor WalletModal — import & JSX shell (Sheet → Dialog)

Replace Component imports:

- `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` → `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- Remove `SHEET_SIDE`, `SHEET_WIDTH` from constants import
- Replace `<Sheet>` → `<Dialog>`, `<SheetContent side={...} className={...}>` → `<DialogContent>`, `<SheetHeader>` → `<DialogHeader>`, `<SheetTitle>` → `<DialogTitle>`
- Remove `internalMode` state and `effectiveMode` computation
- Replace `isCreate`/`isEdit`/`isView` with `!!walletId`
- Remove transaction fetching logic (view mode's transaction list)
- Always render form fields (remove the `isView` conditional for read-only display)

→ verify: `npm run type-check -- --noEmit`

### Step 2: Refactor WalletModal — form logic & buttons

- Create mode (no `walletId`): submit calls `createWallet()`, button label "Create"
- Edit mode (`walletId` present): fetch wallet on open, submit calls `updateWallet()`, button label "Save Changes", enabled only when `formState.isDirty`
- Both modes: "Cancel" / "Close" button always visible
- Edit mode: "Delete" button always visible, calls `deleteWallet()`
- Remove `onOpenChange` wrapper that resets `internalMode` — simplify to direct `onOpenChange`

→ verify: `npx vitest run client/src/components/WalletModal.test.tsx`

### Step 3: Update WalletModal tests

- Remove all `mode` prop references — tests pass `walletId` or omit it
- Update Sheet→Dialog assertions (no `SheetContent` role, use `DialogContent` queries)
- Test unified view: fields always editable regardless of create/edit
- Test `isDirty` behavior: "Save Changes" disabled until a field changes
- Test Delete always visible when `walletId` provided
- Test Cancel closes without saving
- Test loading state while fetching
- Test error state on API failure

→ verify: `npx vitest run client/src/components/WalletModal.test.tsx`

### Step 4: Refactor CategoryModal — import & JSX shell (Sheet → Dialog)

Same mechanical changes as Step 1 but for CategoryModal.tsx.

→ verify: `npm run type-check -- --noEmit`

### Step 5: Refactor CategoryModal — form logic & buttons

Same behavioral changes as Step 2 but for CategoryModal.tsx.

→ verify: `npx vitest run client/src/components/CategoryModal.test.tsx`

### Step 6: Update CategoryModal tests

Same test pattern updates as Step 3 but for CategoryModal.test.tsx.

→ verify: `npx vitest run client/src/components/CategoryModal.test.tsx`

### Step 7: Full integration check

Run the full test suite and type-check to ensure no regressions.

→ verify: `npm run type-check && npm test`

## Verification Script (Step-by-Step)

1. `npm run type-check` — no TypeScript errors
2. `npm test -- --run client/src/components/WalletModal.test.tsx` — all WalletModal tests pass
3. `npm test -- --run client/src/components/CategoryModal.test.tsx` — all CategoryModal tests pass
4. `npm test` — full suite green, ≥80% coverage
5. Manual: Open the app, create a wallet from Settings → Wallets → "New Wallet" → verify Dialog popup with editable fields

## Out of scope

- Updating callers (Home.tsx, WalletList.tsx, Categories.tsx) — done in e11s03
- Removing `SHEET_SIDE`/`SHEET_WIDTH` from constants.ts (may still be used elsewhere)
- Backend changes

## Risks

- **Breaking callers:** WalletModal and CategoryModal props change (remove `mode`). Callers in Home.tsx, WalletList.tsx, Categories.tsx will fail type-check until e11s03 updates them. Mitigation: e11s01 focuses on component internals; e11s03 handles caller integration.
- **Test fragility:** Sheet→Dialog changes DOM structure (different ARIA roles, different container). Tests using `screen.getByRole` may need role updates. Mitigation: update tests in same step as component changes.

## Acceptance Criteria

```gherkin
Scenario: Create a new wallet with unified dialog
  Given I am on the Home page
  When I click "Create wallet" from the transaction form
  Then a centered Dialog opens with empty name, description, and color fields
  And the "Save Changes" button is disabled (form not dirty)
  And no "Delete" button is visible (new wallet)
  When I fill in the name "Checking Account" and pick a color
  Then the "Save Changes" button enables
  When I click "Save Changes"
  Then the wallet is created, the Dialog closes, and the new wallet appears selected

Scenario: Edit an existing wallet with unified dialog
  Given I have a wallet "Old Name"
  When I open the wallet dialog for that wallet
  Then the Dialog opens with "Old Name" pre-filled in the name field
  And "Save Changes" is disabled (no changes yet)
  When I change the name to "New Name"
  Then "Save Changes" enables
  When I click "Save Changes"
  Then the wallet is updated and the Dialog closes

Scenario: Delete a wallet from unified dialog
  Given I have a wallet "To Delete"
  When I open the wallet dialog for that wallet
  Then a "Delete" button is visible
  When I click "Delete"
  Then the wallet is deleted and the Dialog closes

Scenario: Create a new category with icon selection
  Given I am on the Home page
  When I click "Create category" from the transaction form
  Then a centered Dialog opens with empty name, expense type selected, default color and icon
  When I change the type to "income", pick a green color, and select a different icon
  Then "Save Changes" enables
  When I click "Save Changes"
  Then the category is created, the Dialog closes, and the new category appears selected

Scenario: Cancel discards changes
  Given I open a wallet Dialog for an existing wallet
  When I modify the name but click "Cancel"
  Then the Dialog closes without saving changes

Scenario: Loading state on fetch
  Given I open a wallet Dialog for wallet ID "abc123"
  When the wallet data is still loading
  Then a loading indicator is shown
  When the data arrives
  Then the form is pre-filled with the wallet data
```

## Tasks

See `e11s01-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test -- --run client/src/components/WalletModal.test.tsx client/src/components/CategoryModal.test.tsx
```
