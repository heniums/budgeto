# App-Wide Currency Formatting Design

## Goal

Replace every hardcoded `$` money display in the Budgeto client with formatting that uses the wallet's stored currency code.

## Background

The recent per-wallet currency feature added a `currency` column to wallets and allows users to select a currency. However, the UI still formats monetary values with a literal `$` sign. This design makes the displayed currency symbol match each wallet's configured currency.

## Decisions

- **Display style:** localized currency symbol only (e.g., `$50.00`, `€50.00`, `¥5,000`).
- **Formatting engine:** `Intl.NumberFormat(undefined, { style: 'currency', currency })`, so the user's locale controls digit grouping/separators while the wallet's currency controls the symbol.
- **Negative values:** `Intl.NumberFormat` produces the locale-appropriate signed output (e.g., `-$50.00` in `en-US`). The component also applies the existing `text-destructive` color for negative amounts.
- **Fallbacks:** if a currency code is missing or invalid, fall back to `USD`.
- **Scope:** client display only. No server changes. Transfers continue to be recorded in the source/target wallet currencies as they are today.

## Components

### `client/src/lib/currencies.ts`

Add a pure formatting helper:

```ts
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

`isCurrencyCode` can reuse the existing `CURRENCIES` list.

### `client/src/components/Money.tsx` (new)

A reusable component that wraps `formatMoney` and applies color styling (uses the existing `cn()` utility from `client/src/lib/utils.ts`):

```tsx
interface MoneyProps {
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

## Call-Site Changes

### `client/src/pages/Home.tsx`

- Remove the local `formatAmount` helper.
- Add a `walletCurrency(walletId)` helper that looks up `wallets`.
- In the transaction list row, render `<Money amount={tx.amount} currency={walletCurrency(tx.walletId)} />`.
- Update tests that assert `$50.00` to expect the formatted value for the mocked wallet currency.

### `client/src/components/TransactionDetailDialog.tsx`

- Add `walletCurrency: string` to props.
- Remove local `formatAmount`.
- Render `<Money amount={transaction.amount} currency={walletCurrency} />`.
- Update tests to pass the currency prop.

### `client/src/components/TransactionForm.tsx`

- In view mode, replace the hardcoded `$` + `toFixed(2)` block with `<Money amount={viewValues.amount} currency={walletCurrency} />`, looking up the wallet from `wallets`.

### `client/src/pages/WalletList.tsx`

- Replace the raw `{wallet.balance}` display with `<Money amount={wallet.balance} currency={wallet.currency} />`.

## Testing

- Add `client/src/components/Money.test.tsx` covering:
  - USD positive/negative formatting
  - EUR formatting
  - JPY formatting (no decimal places)
  - fallback to USD for invalid currency
  - fallback to `—` for non-numeric amount
- Update existing tests that assert on `$` literals to assert on the formatted output for the mocked wallet currency.
- Mock `Intl.NumberFormat` deterministically in component/unit tests so output is stable regardless of the test environment's default locale.

## Out of Scope

- No server/API changes.
- No currency conversion logic; transfers continue to use the raw amount in each wallet's currency.
- The dead `TransactionDetailDialog` component will be updated for consistency but not removed.

## Verification

After implementation, run:

```bash
npm run type-check
npm run lint
npm test
npm run build
```

All must pass.
