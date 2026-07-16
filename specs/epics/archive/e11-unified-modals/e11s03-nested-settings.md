# e11s03 — Nested Dialogs & Settings Integration

## Story

Implement nested dialog orchestration from the transaction form — opening a
wallet/category Dialog on top of the transaction Dialog. Wire up chip-selector
`onEdit` callbacks to open the unified modals. Integrate the refactored
Dialog-based modals into the Settings pages (WalletList, Categories).

## Design

### 1. Nested dialog orchestration in Home page

When the transaction Dialog is open and the user clicks "Create wallet →",
a second Dialog (WalletModal) opens **on top**. Radix Dialog natively supports
this — opening a Dialog while another is open stacks them. No special state
machine needed.

**Current flow (simplified):**

```tsx
<Dialog open={txOpen} onOpenChange={setTxOpen}>
  <DialogTrigger asChild>
    <Button>Add transaction</Button>
  </DialogTrigger>
  <DialogContent>
    <TransactionForm
      onCreateWallet={() => setCreateWalletOpen(true)}
      onCreateCategory={() => setCreateCategoryOpen(true)}
      ...
    />
  </DialogContent>
</Dialog>

<WalletModal
  mode="create"
  open={createWalletOpen}
  onOpenChange={setCreateWalletOpen}
  ...
/>
```

This already works! The WalletModal opens while the transaction Dialog is
still open. The main changes needed are:

- WalletModal/CategoryModal no longer use `mode` prop (per e11s01)
- `onSuccess` callback: after creating a wallet from the nested dialog,
  set `pendingWalletId` so the transaction form auto-selects the new wallet
- Same for categories: set `pendingCategoryId`
- This pattern already exists in Home.tsx — just update the callback
  signatures to match the new modal props

**Key insight:** Since the underlying transaction Dialog stays mounted
while the nested Dialog is open, the transaction form state is preserved
naturally. No refs, no state lifting, no sequential-close-reopen.

### 2. Chip-selector onEdit → unified modal

WalletSelectList and CategorySelectList already accept `onEdit` callbacks.
In Home.tsx, wire them to open the unified modals:

```tsx
// In TransactionForm props:
onEditWallet?: (walletId: string) => void;
onEditCategory?: (categoryId: string) => void;

// In Home.tsx:
<TransactionForm
  onEditWallet={(walletId) => setDetailWalletId(walletId)}
  onEditCategory={(categoryId) => setDetailCategoryId(categoryId)}
  ...
/>

// WalletModal/CategoryModal open when detailWalletId/detailCategoryId is set:
<WalletModal
  open={detailWalletId !== null}
  onOpenChange={(open) => { if (!open) setDetailWalletId(null); }}
  walletId={detailWalletId ?? undefined}
  onSuccess={() => { setDetailWalletId(null); load(); }}
/>
```

The `onEdit` is triggered by:

- Long-press on a wallet chip (mobile)
- Context menu "Edit" on a wallet chip (desktop)
- Shift+Enter on a focused chip (keyboard)

The TransactionForm already passes `onViewWallet` for viewing — we can add an
`onEditWallet` for editing. Or reuse `onViewWallet` since the unified modal
no longer distinguishes view from edit (all fields are always editable).

**Decision:** The chip context menu/long-press currently says "Edit". With
unified modals, this opens the same Dialog that shows the form always-editable.
The `onEdit` callback should open the unified modal. We can keep using
`onViewWallet` for this since the modal no longer has separate view mode.

### 3. Settings pages integration

**WalletList.tsx** already uses WalletModal:

```tsx
<WalletModal
  mode={modalMode ?? 'view'}
  open={modalMode !== null}
  ...
/>
```

Update to remove the `mode` prop:

```tsx
<WalletModal
  open={modalMode !== null}
  onOpenChange={(open) => {
    if (!open) {
      setModalMode(null);
      setSelectedWalletId(null);
    }
  }}
  walletId={selectedWalletId ?? undefined}
  onSuccess={() => {
    setModalMode(null);
    setSelectedWalletId(null);
    load();
  }}
/>
```

When `modalMode === 'create'`, `selectedWalletId` is null → WalletModal opens
in create mode (no prefill). When `modalMode === 'view'`, `selectedWalletId`
is set → WalletModal opens in unified mode with fields pre-filled.

**Categories.tsx** — same pattern.

**No route changes needed** — the Settings pages already use modals for CRUD.
Only the modal component props change.

## Acceptance Criteria

```gherkin
Scenario: Create wallet from inside transaction form (nested dialog)
  Given the transaction Dialog is open
  When I click "Don't see your wallet? Create one →"
  Then a WalletModal Dialog opens ON TOP of the transaction Dialog
  When I fill in wallet details and click "Save Changes"
  Then the wallet is created
  And the WalletModal Dialog closes
  And the transaction Dialog is still open underneath
  And the new wallet is auto-selected in the transaction form

Scenario: Create category from inside transaction form (nested dialog)
  Given the transaction Dialog is open with a wallet selected
  When I click "Don't see your category? Create one →"
  Then a CategoryModal Dialog opens ON TOP
  When I fill in category details and click "Save Changes"
  Then the category is created
  And the CategoryModal Dialog closes
  And the new category is auto-selected

Scenario: Edit wallet from chip context menu
  Given the transaction Dialog is open with wallets listed
  When I right-click a wallet chip and select "Edit"
  Then a WalletModal Dialog opens ON TOP with that wallet's fields pre-filled
  When I change the name and click "Save Changes"
  Then the wallet is updated and the Dialog closes

Scenario: View wallet from Settings page
  Given I navigate to Settings → Wallets
  When I click on a wallet name
  Then a WalletModal Dialog opens (centered popup) with the wallet's fields pre-filled and editable
  And "Save Changes" is disabled (not dirty)

Scenario: Create wallet from Settings page
  Given I navigate to Settings → Wallets
  When I click "New Wallet"
  Then a WalletModal Dialog opens with empty fields
  When I fill in details and click "Save Changes"
  Then the wallet is created and appears in the list

Scenario: Nested dialog cancel returns focus correctly
  Given the transaction Dialog is open
  And I open a WalletModal Dialog on top
  When I click "Cancel" in the WalletModal Dialog
  Then the WalletModal Dialog closes
  And focus returns to the transaction Dialog underneath
  And the transaction form state is unchanged
```

## Tasks

See `e11s03-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test -- --run client/src/pages/Home.test.tsx client/src/pages/WalletList.test.tsx client/src/pages/Categories.test.tsx
```
