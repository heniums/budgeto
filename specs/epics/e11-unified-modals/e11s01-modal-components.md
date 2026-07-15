# e11s01 — WalletModal + CategoryModal Components

## Story

Build two unified Sheet-based modal components — `WalletModal` and
`CategoryModal` — that become the single source of truth for wallet and category
CRUD everywhere in the app. Each modal supports three modes: `create`, `edit`,
and `view`.

## Design

### WalletModal

Uses shadcn `Sheet` (side="right") with `SheetContent`, `SheetHeader`,
`SheetTitle`.

**Props:**

```ts
interface WalletModalProps {
  mode: 'create' | 'edit' | 'view';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string; // required for edit/view
  onSuccess?: (wallet?: WalletData) => void;
}
```

**Create mode:**

- Empty form: name (Input), description (Input), color (color Input)
- Submit calls `createWallet()` from api/wallets.ts
- On success, calls `onSuccess(newWallet)`
- Shows loading/saving states, validation errors

**Edit mode:**

- Fetches wallet by ID on open, prefills form
- Submit calls `updateWallet()` from api/wallets.ts
- Delete button calls `deleteWallet()` with confirmation
- On success, calls `onSuccess()`

**View mode:**

- Fetches wallet by ID on open
- Shows wallet name, description, balance, color swatch
- Fetches filtered transactions for this wallet
- Shows transaction list (date, description, amount)
- "Edit" button switches to edit mode
- Loading, empty, error states handled

### CategoryModal

Uses shadcn `Sheet` (side="right") with `SheetContent`, `SheetHeader`,
`SheetTitle`.

**Props:**

```ts
interface CategoryModalProps {
  mode: 'create' | 'edit' | 'view';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string; // required for edit/view
  onSuccess?: (category?: CategoryData) => void;
}
```

**Create mode:**

- Empty form: name (Input), type (radio: income/expense), color (color Input),
  icon grid (reuse ICONS from lib/icons.ts)
- Submit calls `createCategory()` from api/categories.ts
- On success, calls `onSuccess(newCategory)`

**Edit mode:**

- Fetches category by ID on open, prefills form including icon
- Submit calls `updateCategory()` from api/categories.ts
- Delete button calls `deleteCategory()` with confirmation
- On success, calls `onSuccess()`

**View mode:**

- Fetches category by ID on open
- Shows category name, type badge, color swatch, icon rendered in color
- "Edit" button switches to edit mode
- Loading, empty, error states handled

### Shared patterns

- Use `useEffect` with active flag for data fetching
- Use local `useState` for form fields (not react-hook-form — simpler for
  Sheet-based forms; or use react-hook-form + zodResolver for consistency)
- Error display: red alert banner at top of form
- Loading: "Loading…" text while fetching for edit/view
- Sheet closes on successful save/delete
- All API calls wrapped in try/catch with ApiError handling

## Tasks

See `e11s01-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test -- --run client/src/components/WalletModal.test.tsx client/src/components/CategoryModal.test.tsx
```
