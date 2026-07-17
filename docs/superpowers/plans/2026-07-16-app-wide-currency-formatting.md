# App-Wide Currency Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hardcoded `$` money display in the Budgeto client with a reusable component that formats amounts using each wallet's stored currency code.

**Architecture:** Add a `formatMoney` helper in `client/src/lib/currencies.ts` backed by `Intl.NumberFormat`, then expose it through a small `Money` component that applies the existing positive/negative color styling. Update the four display sites (Home transaction list, TransactionForm view mode, TransactionDetailDialog, WalletList balance) to look up the relevant wallet currency and render `<Money>`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, `Intl.NumberFormat`.

## Global Constraints

- TypeScript `strict: true`; no `any` or non-null assertions without justification.
- Single quotes and semicolons; named exports only (except Express routers).
- One component per file, colocated with its test.
- Client API modules export plain async functions; components manage local state.
- All changes must pass `npm run type-check`, `npm run lint`, `npm test`, and `npm run build`.
- Keep changes minimal — no server work, no currency conversion, no unrelated refactoring.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `client/src/lib/currencies.ts` | Existing currency list + new `isCurrencyCode` and `formatMoney` helpers. |
| `client/src/components/Money.tsx` | New reusable component wrapping `formatMoney` with color styling. |
| `client/src/components/Money.test.tsx` | Unit tests for the `Money` component. |
| `client/src/pages/Home.tsx` | Transaction list; replace local `formatAmount` with `<Money>`. |
| `client/src/components/TransactionForm.tsx` | View-mode amount display; replace hardcoded `$` with `<Money>`. |
| `client/src/components/TransactionDetailDialog.tsx` | Detail view; add `walletCurrency` prop and use `<Money>`. |
| `client/src/pages/WalletList.tsx` | Wallet balance column; format with `<Money>`. |

---

### Task 1: Add `formatMoney` helper to `client/src/lib/currencies.ts`

**Files:**
- Modify: `client/src/lib/currencies.ts`
- Test: `client/src/lib/currencies.test.ts`

**Interfaces:**
- Consumes: existing `CURRENCIES` array and `CurrencyCode` type.
- Produces: `isCurrencyCode(code: string): code is CurrencyCode` and `formatMoney(amount: string, currency: string): string`.

- [ ] **Step 1: Write the failing test**

Append to `client/src/lib/currencies.test.ts`:

```ts
import { formatMoney, isCurrencyCode } from './currencies';

describe('isCurrencyCode', () => {
  it('returns true for supported codes', () => {
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('EUR')).toBe(true);
  });

  it('returns false for unsupported codes', () => {
    expect(isCurrencyCode('XYZ')).toBe(false);
    expect(isCurrencyCode('')).toBe(false);
  });
});

describe('formatMoney', () => {
  it('formats USD with two decimals', () => {
    expect(formatMoney('50', 'USD')).toBe('$50.00');
  });

  it('formats negative USD', () => {
    expect(formatMoney('-42.5', 'USD')).toBe('-$42.50');
  });

  it('formats JPY without decimals', () => {
    expect(formatMoney('5000', 'JPY')).toBe('¥5,000');
  });

  it('falls back to USD for invalid currency', () => {
    expect(formatMoney('100', 'XYZ')).toBe('$100.00');
  });

  it('returns em dash for non-numeric amount', () => {
    expect(formatMoney('not-a-number', 'USD')).toBe('—');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/lib/currencies.test.ts
```

Expected: FAIL — `formatMoney` and `isCurrencyCode` are not exported.

- [ ] **Step 3: Implement the helpers**

In `client/src/lib/currencies.ts`, add after the `CurrencyCode` export:

```ts
export function isCurrencyCode(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

export function formatMoney(amount: string, currency: string): string {
  const code = isCurrencyCode(currency) ? currency : 'USD';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
  }).format(n);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/lib/currencies.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/currencies.ts client/src/lib/currencies.test.ts
git commit -m "feat(currencies): add formatMoney helper with fallback"
```

---

### Task 2: Create the `Money` component

**Files:**
- Create: `client/src/components/Money.tsx`
- Test: `client/src/components/Money.test.tsx`

**Interfaces:**
- Consumes: `formatMoney` from `client/src/lib/currencies.ts`.
- Produces: `Money` component with props `{ amount: string; currency: string; className?: string }`.

- [ ] **Step 1: Write the failing test**

Create `client/src/components/Money.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Money } from './Money';

describe('Money', () => {
  it('renders formatted USD', () => {
    render(<Money amount="50" currency="USD" />);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('renders formatted EUR', () => {
    render(<Money amount="50" currency="EUR" />);
    expect(screen.getByText('€50.00')).toBeInTheDocument();
  });

  it('applies destructive color for negative amounts', () => {
    render(<Money amount="-50" currency="USD" />);
    const span = screen.getByText('-$50.00');
    expect(span.className).toContain('text-destructive');
  });

  it('applies foreground color for positive amounts', () => {
    render(<Money amount="50" currency="USD" />);
    const span = screen.getByText('$50.00');
    expect(span.className).toContain('text-foreground');
  });

  it('accepts an additional className', () => {
    render(<Money amount="50" currency="USD" className="font-bold" />);
    const span = screen.getByText('$50.00');
    expect(span.className).toContain('font-bold');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/components/Money.test.tsx
```

Expected: FAIL — `Money` component does not exist.

- [ ] **Step 3: Implement the component**

Create `client/src/components/Money.tsx`:

```tsx
import { formatMoney } from '../lib/currencies';
import { cn } from '@/lib/utils';

export interface MoneyProps {
  amount: string;
  currency: string;
  className?: string;
}

export function Money({ amount, currency, className }: MoneyProps): JSX.Element {
  const n = Number(amount);
  const negative = Number.isFinite(n) && n < 0;
  return (
    <span
      className={cn(
        negative ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      {formatMoney(amount, currency)}
    </span>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/components/Money.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Money.tsx client/src/components/Money.test.tsx
git commit -m "feat(money): add reusable Money component"
```

---

### Task 3: Format transaction amounts in `Home.tsx`

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Test: `client/src/pages/Home.test.tsx`

**Interfaces:**
- Consumes: `Money` component; existing `wallets` state.
- Produces: `walletCurrency(walletId: string): string` helper used inside transaction row rendering.

- [ ] **Step 1: Update `Home.tsx`**

1. Add import:

```tsx
import { Money } from '../components/Money';
```

2. Remove the local `formatAmount` function (lines 69-73).

3. Add a currency lookup helper next to `walletName`:

```tsx
const walletCurrency = (walletId: string): string =>
  wallets.find((w) => w.id === walletId)?.currency ?? 'USD';
```

4. In the transaction row (around line 590), replace:

```tsx
{formatAmount(tx.amount)}
```

with:

```tsx
<Money amount={tx.amount} currency={walletCurrency(tx.walletId)} />
```

- [ ] **Step 2: Update `Home.test.tsx` if needed**

Existing mocked wallets already use `currency: 'USD'`, so `Intl.NumberFormat(undefined, { currency: 'USD' })` in the jsdom environment should still produce `$50.00`. Run the test to confirm.

If the environment locale differs from `en-US`, mock `navigator.language` or `Intl.NumberFormat` in the test, or assert on the rendered text using a regex (e.g., `/50\.00/`).

- [ ] **Step 3: Run the test**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/pages/Home.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Home.tsx client/src/pages/Home.test.tsx
git commit -m "feat(home): format transaction amounts with wallet currency"
```

---

### Task 4: Format amount in `TransactionForm` view mode

**Files:**
- Modify: `client/src/components/TransactionForm.tsx`

**Interfaces:**
- Consumes: `Money` component; existing `wallets` prop and `viewValues.walletId`.

- [ ] **Step 1: Update `TransactionForm.tsx`**

1. Add import:

```tsx
import { Money } from './Money';
```

2. In view mode (around line 254), replace the hardcoded amount display:

```tsx
<p
  className={`text-lg font-semibold ${
    Number(viewValues.amount) < 0
      ? 'text-destructive'
      : 'text-foreground'
  }`}
>
  {Number(viewValues.amount) < 0 ? '-' : ''}$
  {Math.abs(Number(viewValues.amount)).toFixed(2)}
</p>
```

with:

```tsx
const viewWalletCurrency =
  wallets.find((w) => w.id === viewValues.walletId)?.currency ?? 'USD';

// ...

<p className="text-lg font-semibold">
  <Money amount={viewValues.amount} currency={viewWalletCurrency} />
</p>
```

- [ ] **Step 2: Update `TransactionForm.test.tsx` if needed**

Check if any test asserts the literal `$` text in view mode. If so, update to expect the formatted value for the mocked wallet currency.

- [ ] **Step 3: Run the test**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/components/TransactionForm.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TransactionForm.tsx client/src/components/TransactionForm.test.tsx
git commit -m "feat(transaction-form): format view-mode amount with wallet currency"
```

---

### Task 5: Format amount in `TransactionDetailDialog`

**Files:**
- Modify: `client/src/components/TransactionDetailDialog.tsx`
- Test: `client/src/components/TransactionDetailDialog.test.tsx`

**Interfaces:**
- Consumes: `Money` component.
- Produces: `TransactionDetailDialogProps` gains `walletCurrency: string`.

- [ ] **Step 1: Update `TransactionDetailDialog.tsx`**

1. Add import:

```tsx
import { Money } from './Money';
```

2. Remove the local `formatAmount` function.

3. Add `walletCurrency` to props:

```tsx
interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionData;
  walletName: string;
  walletCurrency: string;
  categoryColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}
```

4. Destructure `walletCurrency` and render `<Money>`:

```tsx
export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  walletName,
  walletCurrency,
  categoryColor,
  onEdit,
  onDelete,
}: TransactionDetailDialogProps): JSX.Element {
  // ...
  <Money amount={transaction.amount} currency={walletCurrency} />
```

- [ ] **Step 2: Update `TransactionDetailDialog.test.tsx`**

Add `walletCurrency="USD"` to every render call and update the assertion from `'-$42.50'` to the formatted value for USD (still `'-$42.50'` in `en-US`).

- [ ] **Step 3: Run the test**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/components/TransactionDetailDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TransactionDetailDialog.tsx client/src/components/TransactionDetailDialog.test.tsx
git commit -m "feat(transaction-detail): format amount with wallet currency"
```

---

### Task 6: Format wallet balances in `WalletList.tsx`

**Files:**
- Modify: `client/src/pages/WalletList.tsx`
- Test: `client/src/pages/WalletList.test.tsx`

**Interfaces:**
- Consumes: `Money` component; existing `wallet.currency` and `wallet.balance` fields.

- [ ] **Step 1: Update `WalletList.tsx`**

1. Add import:

```tsx
import { Money } from '../components/Money';
```

2. Replace the raw balance cell (around line 178):

```tsx
<TableCell className="text-right font-medium">
  {wallet.balance}
</TableCell>
```

with:

```tsx
<TableCell className="text-right font-medium">
  <Money amount={wallet.balance} currency={wallet.currency} />
</TableCell>
```

- [ ] **Step 2: Update `WalletList.test.tsx` if needed**

Check assertions on balance text. Mocked wallets use `currency: 'USD'` and balances like `'100.00'`, so the formatted text should be `$100.00`. Update assertions if they currently match the raw string.

- [ ] **Step 3: Run the test**

```bash
CI=true npx vitest run --config client/vitest.config.ts client/src/pages/WalletList.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/WalletList.tsx client/src/pages/WalletList.test.tsx
git commit -m "feat(wallet-list): format balances with wallet currency"
```

---

### Task 7: Final verification

**Files:** all of the above.

- [ ] **Step 1: Run type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all server and client tests pass.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit any remaining fixes**

If any verification step required fixes, commit them. Otherwise, no additional commit needed.

---

## Self-Review

**Spec coverage:**
- ✅ Display style: localized symbol via `Intl.NumberFormat` — covered in Task 1 and Task 2.
- ✅ Wallet currency lookup for transactions — covered in Task 3 and Task 4.
- ✅ Wallet balance formatting — covered in Task 6.
- ✅ Fallback to USD for invalid currency — covered in Task 1 tests.
- ✅ Non-numeric fallback to `—` — covered in Task 1 tests.
- ✅ No server changes, no conversion logic — explicit in global constraints.
- ✅ Verification commands — Task 7.

**Placeholder scan:**
- No TBD/TODO placeholders.
- Each step includes exact file paths, code, commands, and expected output.

**Type consistency:**
- `formatMoney(amount: string, currency: string): string` used everywhere.
- `MoneyProps` matches the helper signature.
- `walletCurrency` returns `string`, matching `MoneyProps.currency`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-16-app-wide-currency-formatting.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach would you like?
