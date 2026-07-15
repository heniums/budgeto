# e11s02 — Transaction Form Auto-select, Mandatory Category & Hard Guard

## Story

Add three guards/quality-of-life improvements to the transaction form:

1. **Auto-select first wallet + category** on open
2. **Category mandatory** — schema change: `categoryId` required
3. **Hard guard** — "Add transaction" button disabled when no wallets or
   categories exist, with guidance text directing the user to create them

## Design

### 1. Auto-select first wallet & category

TransactionForm already accepts `autoSelectWalletId` and `autoSelectCategoryId`
props. The change is in the **caller** (Home page): when opening the
transaction dialog, pass the first wallet ID and first category ID (if they
exist):

```tsx
// In Home.tsx, when opening the transaction Dialog:
const firstWalletId = wallets.length > 0 ? wallets[0].id : undefined;
const firstCategoryId = categories.length > 0 ? categories[0].id : undefined;

// Pass to TransactionForm:
<TransactionForm
  autoSelectWalletId={firstWalletId}
  autoSelectCategoryId={firstCategoryId}
  ...
/>
```

The `useEffect` hooks in TransactionForm already handle auto-selection when
these props change. No TransactionForm changes needed for this part.

### 2. Category mandatory

Change the Zod schema in TransactionForm:

```ts
// Before:
categoryId: z.string().optional(),

// After:
categoryId: z.string().min(1, 'Please select a category.'),
```

This means:

- The "Add Transaction" / "Save changes" button is disabled until a category
  is selected (zod validation fails)
- The category selector shows a validation error if empty on submit attempt
- This is client-side only — the server still accepts optional categoryId
  (no backend migration needed)

### 3. Hard guard — disable "Add transaction" button

In Home.tsx, the "Add transaction" button is currently always enabled:

```tsx
<DialogTrigger asChild>
  <Button>Add transaction</Button>
</DialogTrigger>
```

Change to conditionally disable and add guidance:

```tsx
{
  /* When both wallets and categories exist: */
}
{
  wallets.length > 0 && categories.length > 0 ? (
    <Dialog open={txOpen} onOpenChange={setTxOpen}>
      <DialogTrigger asChild>
        <Button>Add transaction</Button>
      </DialogTrigger>
      <DialogContent>...</DialogContent>
    </Dialog>
  ) : (
    <Button
      disabled
      title="You need at least one wallet and one category to add a transaction"
    >
      Add transaction
    </Button>
  );
}
```

Also show a contextual message:

```tsx
{
  wallets.length === 0 && (
    <p className="text-sm text-muted-foreground">
      Create a wallet first to start adding transactions.
    </p>
  );
}
{
  categories.length === 0 && wallets.length > 0 && (
    <p className="text-sm text-muted-foreground">
      Create a category to start adding transactions.
    </p>
  );
}
```

The existing empty-state sections in Home.tsx (when both wallets and
categories are empty, showing onboarding prompts) already cover the case
where there's nothing at all. The disabled button is for when exactly one
of the two is missing.

## Implementation Steps

**type:** feat
**risk:** P1
**context:** domain
**Context:** Adds auto-select, mandatory category, and hard guard to the transaction form. Touches TransactionForm.tsx (schema change), Home.tsx (auto-select + disabled button), and their tests.

### Step 1: Make categoryId mandatory in TransactionForm schema

Change Zod schema: `categoryId: z.string().min(1, 'Please select a category.')`. Remove `.optional()`. Add validation error display next to category selector. The submit button is disabled when form is invalid (React Hook Form handles this via `isValid` or by checking `errors`).

→ verify: `npm run type-check -- --noEmit`

### Step 2: Auto-select first wallet and category in Home.tsx

In the transaction Dialog open handler, compute `firstWalletId = wallets[0]?.id` and `firstCategoryId = categories[0]?.id`. Pass as `autoSelectWalletId` and `autoSelectCategoryId` to TransactionForm. The existing `useEffect` hooks in TransactionForm handle the rest.

→ verify: `npx vitest run --config client/vitest.config.ts client/src/pages/Home.test.tsx`

### Step 3: Disable "Add transaction" button when wallets or categories empty

In Home.tsx, wrap the Dialog+DialogTrigger in a conditional. When `wallets.length === 0 || categories.length === 0`, render a disabled `<Button>` with a tooltip and contextual guidance text.

→ verify: `npx vitest run --config client/vitest.config.ts client/src/pages/Home.test.tsx`

### Step 4: Update TransactionForm tests for mandatory category

Add test: form is invalid without category selection. Add test: validation error shown when submitting without category. Update existing tests that didn't pass categoryId to now include it.

→ verify: `npx vitest run --config client/vitest.config.ts client/src/components/TransactionForm.test.tsx`

### Step 5: Update Home tests for auto-select and disabled button

Add tests: "Add transaction" button disabled when no wallets, disabled when no categories, enabled when both exist. Add test: auto-select first wallet and category on open.

→ verify: `npx vitest run --config client/vitest.config.ts client/src/pages/Home.test.tsx`

### Step 6: Full integration check

→ verify: `npm run type-check && npm test`

## Out of scope

- Backend enforcement of mandatory category (server schema still optional)
- Changes to the edit transaction flow (same schema applies)

## Risks

- **Existing transaction entries may have null categoryId.** The server returns transactions with categoryId: null. The TransactionForm must handle this gracefully. Mitigation: Initial values in edit mode may have empty categoryId — form shows "not selected" state.

## Acceptance Criteria

```gherkin
Scenario: Auto-select first wallet and category on transaction form open
  Given I have wallets "Cash" and "Bank"
  And I have categories "Food" and "Transport"
  When I click "Add transaction"
  Then the transaction Dialog opens with "Cash" pre-selected as wallet
  And "Food" pre-selected as category

Scenario: Category is mandatory
  Given the transaction form is open with wallet and category pre-selected
  When I clear the category selection
  And I try to submit the form
  Then a validation error "Please select a category." is shown
  And the transaction is not created

Scenario: "Add transaction" button disabled when no wallets
  Given I have 0 wallets
  And I have 1 category
  When I view the Home page
  Then the "Add transaction" button is disabled
  And I see guidance text about creating a wallet first

Scenario: "Add transaction" button disabled when no categories
  Given I have 1 wallet
  And I have 0 categories
  When I view the Home page
  Then the "Add transaction" button is disabled
  And I see guidance text about creating a category first

Scenario: "Add transaction" button enabled when both exist
  Given I have at least 1 wallet
  And I have at least 1 category
  When I view the Home page
  Then the "Add transaction" button is enabled
```

## Tasks

See `e11s02-tasks.yaml`.

## Verify

```bash
npm run type-check && npm test -- --run client/src/components/TransactionForm.test.tsx client/src/pages/Home.test.tsx
```
