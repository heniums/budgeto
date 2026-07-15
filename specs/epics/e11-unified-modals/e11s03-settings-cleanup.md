# e11s03 — Settings Integration + Route Cleanup + Removal of Old Components

## Story

Integrate `WalletModal` and `CategoryModal` into the Settings page (Wallets and
Categories tabs). Remove all old full-page form routes, the WalletDetail page,
and the WalletDetailSheet/CategoryDetailSheet components. Clean up the router
and delete dead files.

## Design

### WalletList page changes

Currently uses `<Link to="/settings/wallets/new">` and
`<Link to="/settings/wallets/:id">`. Replace with state-driven modals:

```tsx
const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(
  null,
);
const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

// "New Wallet" button → setModalMode('create')
// Tapping a wallet → setSelectedWalletId(wallet.id); setModalMode('view')
// "Edit" in view mode → setModalMode('edit')
```

Remove `handleDelete` — deletion is handled inside WalletModal (edit mode).

Wire WalletModal:

```tsx
<WalletModal
  mode={modalMode}
  open={modalMode !== null}
  onOpenChange={(open) => {
    if (!open) setModalMode(null);
  }}
  walletId={selectedWalletId ?? undefined}
  onSuccess={(wallet) => {
    setModalMode(null);
    refreshWalletList();
  }}
/>
```

Remove:

- `Link` imports for `/settings/wallets/new` and `/settings/wallets/:id`
- The inline delete button + `handleDelete` function
- Route-based navigation for wallet CRUD

### Categories page changes

Same pattern as WalletList:

- "New Category" button opens CategoryModal in create mode
- "Edit" link → opens CategoryModal in edit mode
- Remove delete button (handled inside CategoryModal)
- Remove `Link` imports for category form routes

### Router cleanup

Remove routes:

- `/settings/wallets/new` → deleted
- `/settings/wallets/:id` → deleted
- `/settings/wallets/:id/edit` → deleted
- `/settings/categories/new` → deleted
- `/settings/categories/:id/edit` → deleted

Remove imports:

- `WalletForm` from router
- `WalletDetail` from router
- `CategoryForm` from router

### Components to delete

1. **`client/src/components/WalletDetailSheet.tsx`** — replaced by WalletModal view mode
2. **`client/src/components/CategoryDetailSheet.tsx`** — replaced by CategoryModal view mode
3. **`client/src/pages/WalletForm.tsx`** — replaced by WalletModal create/edit modes
4. **`client/src/pages/CategoryForm.tsx`** — replaced by CategoryModal create/edit modes
5. **`client/src/pages/WalletDetail.tsx`** — replaced by WalletModal view mode

### Test files to delete

1. `client/src/components/WalletDetailSheet.test.tsx`
2. `client/src/components/CategoryDetailSheet.test.tsx`
3. `client/src/pages/WalletForm.test.tsx`
4. `client/src/pages/CategoryForm.test.tsx`
5. `client/src/pages/WalletDetail.test.tsx`

### Test files to update

1. `client/src/pages/WalletList.test.tsx` — update for modal-based flow
2. `client/src/pages/Categories.test.tsx` — update for modal-based flow

## Tasks

See `e11s03-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test
```
