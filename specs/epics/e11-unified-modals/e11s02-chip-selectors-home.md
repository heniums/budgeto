# e11s02 — Simplify Chip-Selectors + Home Page Sequential Transition

## Story

Simplify `WalletSelectList` and `CategorySelectList` to remove all inline
Dialog components. Instead, they emit callbacks (`onCreate`, `onEdit`,
`onViewAll`) that the parent handles by opening `WalletModal`/`CategoryModal`.

Refactor the Home page to manage a sequential modal state machine: transaction
Dialog ↔ wallet/category Sheet, with transaction form state preserved across
the round-trip.

## Design

### WalletSelectList simplification

**Remove:**

- `WalletEditDialog` component
- `WalletCreateDialog` component
- `WalletViewAllDialog` component
- All associated Dialog imports and state (`editWallet`, `showCreate`, `showViewAll`)

**Keep:**

- `LongPressWalletChip` (but simplify — long-press calls `onEdit(wallet)` directly)
- `ScrollArea` with wallet chips
- `Plus` and `Grid3X3` buttons
- ContextMenu for desktop edit trigger
- Keyboard navigation

**New callback props:**

```ts
interface WalletSelectListProps {
  wallets: WalletItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh?: () => void;
  onCreate?: () => void; // NEW: parent opens WalletModal create
  onEdit?: (wallet: WalletItem) => void; // NEW: parent opens WalletModal edit
  onViewAll?: () => void; // NEW: parent opens WalletModal view grid
}
```

When `onCreate`/`onEdit`/`onViewAll` are not provided, hide the + button,
context menu edit, and grid button (graceful degradation).

### CategorySelectList simplification

Same pattern: remove `CategoryEditDialog`, `CategoryCreateDialog`,
`CategoryViewAllDialog`. Emit `onCreate`, `onEdit`, `onViewAll` callbacks.

### Home page refactor

**State machine:**

```
IDLE
  → TX_OPEN (TransactionForm Dialog visible)
    → WALLET_CREATE (TransactionForm Dialog hidden, WalletModal Sheet visible)
    → WALLET_EDIT (TransactionForm Dialog hidden, WalletModal Sheet visible)
    → WALLET_VIEW (TransactionForm Dialog hidden, WalletModal Sheet visible)
    → CATEGORY_CREATE (TransactionForm Dialog hidden, CategoryModal Sheet visible)
    → CATEGORY_EDIT (TransactionForm Dialog hidden, CategoryModal Sheet visible)
    → CATEGORY_VIEW (TransactionForm Dialog hidden, CategoryModal Sheet visible)
```

**Transaction state preservation:**
The TransactionForm uses `react-hook-form`. Key insight: the form is inside a
Dialog. When the Dialog's `open` prop is set to `false`, the Dialog content
unmounts. To preserve state, we need to either:

1. **Keep Dialog mounted** — use CSS visibility/opacity instead of conditional
   rendering to "hide" the Dialog while the Sheet is open. This is the simplest
   approach but may cause z-index issues.
2. **Lift state to Home** — pass `defaultValues` to TransactionForm from the
   Home page, and read values back via a callback before closing. Complex and
   fragile.
3. **Use `key` prop trick** — keep the Dialog always open but use a state
   machine that controls which modal is visible via z-index/opacity.

**Recommended approach:** Keep the transaction Dialog always mounted but toggle
visibility with CSS. When the Sheet opens, add `invisible` + `pointer-events-none`
to the Dialog (or use a wrapper div with `hidden`). The Dialog's children
(TransactionForm) stay mounted so react-hook-form state is preserved.

Actually, the simplest approach: use the `open` prop on Dialog but wrap
TransactionForm in a component that holds the form state externally via a ref.
When the Dialog opens, the form initializes from the saved state.

**Simplest approach:** Don't unmount the Dialog. Use a state variable
`activeModal: 'tx' | 'wallet' | 'category' | null` and render all modals,
controlling which is visible:

```tsx
<Dialog open={activeModal === 'tx'} onOpenChange={...}>
  <DialogContent className={activeModal !== 'tx' ? 'hidden' : ''}>
    <TransactionForm ... />
  </DialogContent>
</Dialog>

<WalletModal open={activeModal === 'wallet-create' || activeModal === 'wallet-edit' || activeModal === 'wallet-view'} ... />
<CategoryModal open={activeModal === 'category-create' || ...} ... />
```

Wait, the user wants a slide animation. Let me think about this more carefully.

The cleanest approach: use a single container div that hosts both the Dialog
and the Sheet. When transitioning, add CSS transition classes. But shadcn
Dialog and Sheet don't easily share a transition context.

**Practical approach:** The Dialog closes (with a brief delay via CSS), then
the Sheet opens. On return, Sheet closes, Dialog reopens. The TransactionForm
state is preserved by keeping the form values in a ref at the Home level.
Before the Dialog closes, we snapshot the form values. When the Dialog reopens,
we restore them.

Actually, even simpler: use `react-hook-form`'s `watch` to track values, store
them in a ref when the Dialog is about to close, and pass them as
`initialValues` when reopening. The TransactionForm already supports
`initialValues` for edit mode — we can use the same mechanism.

```tsx
// In Home page:
const savedTxFormRef = useRef<TransactionValues | null>(null);

// Before opening wallet modal:
// 1. Snapshot current form values (need access to form's getValues)
// 2. Close tx dialog
// 3. Open wallet modal

// When wallet modal completes:
// 1. Close wallet modal
// 2. Reopen tx dialog with saved values
```

This requires TransactionForm to expose its form state. We can do this with
`useImperativeHandle` + `forwardRef`, or by passing a callback
`onBeforeClose` that receives the current values.

**Chosen approach for e11s02:** Add an `onBeforeClose` prop to TransactionForm.
Before the Home page transitions to the wallet/category Sheet, it calls a ref
to get the current form values, stores them, closes the Dialog, opens the Sheet.
When returning, it reopens the Dialog with the saved values as `initialValues`.

Add `formRef` (React.forwardRef + useImperativeHandle) to TransactionForm
exposing `getValues(): TransactionValues`.

## Tasks

See `e11s02-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test -- --run client/src/components/WalletSelectList.test.tsx client/src/components/CategorySelectList.test.tsx client/src/pages/Home.test.tsx
```
