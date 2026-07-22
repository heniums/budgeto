# Budget Schema Design Best Practices

Research findings from Actual Budget, Firefly III, and industry patterns for personal finance app database schemas.

## Executive Summary

This document synthesizes database schema patterns from open-source budget applications (Actual Budget, Firefly III) and established design principles from commercial apps (YNAB, Mint) to provide recommendations for Budgeto's budget tracking system.

## Key Findings

### 1. Two Fundamental Budget Models

**Model A: Envelope Budgeting (YNAB, Actual Budget)**
- Money is allocated to categories as "envelopes"
- Each envelope has a budgeted amount per period
- Rollover: unspent money carries forward
- Focus: "Give every dollar a job"
- Best for: Active budgeters who want granular control

**Model B: Spending Limits (Firefly III, Mint)**
- Set spending limits per category per period
- Track actual vs. budgeted
- No rollover (or optional rollover)
- Focus: "Don't overspend in these categories"
- Best for: Passive tracking and limit-setting

**Recommendation for Budgeto:** Support both models via a flexible schema that can accommodate envelope-style allocation with optional rollover behavior.

---

### 2. Actual Budget Schema Analysis

Actual Budget uses a **spreadsheet-based** approach where budget data is stored as cells in a virtual spreadsheet.

#### Core Schema Pattern:
```
spreadsheet_cells:
  name: TEXT (e.g., "budget2024-01!category-uuid")
  expr: TEXT (formula or value)
  cachedValue: TEXT (computed result)
```

**Key Characteristics:**
- **Integer amounts**: All amounts stored as integers (cents) to avoid floating-point errors
- **Month-keyed budgets**: Each budget is keyed by month string (e.g., "2024-01")
- **Category-based**: Budget cells are linked to category UUIDs
- **No separate budget table**: Budgets are just spreadsheet cells with naming conventions
- **Rollover**: Computed at query time by summing previous months' unspent amounts
- **Templates**: Stored as "goals" in category notes, parsed at runtime

**Strengths:**
- Extremely flexible and dynamic
- Simple mental model (spreadsheet)
- No complex schema migrations needed

**Weaknesses:**
- Harder to query directly (need to parse spreadsheet keys)
- No explicit period tracking
- Rollover must be computed, not stored

---

### 3. Firefly III Schema Analysis

Firefly III uses a traditional **relational database** approach with explicit tables for each concept.

#### Budget Tables:

**`budgets`** (budget definition/template)
```sql
id: int (PK)
user_id: int (FK)
name: string
active: boolean
created_at, updated_at, deleted_at
```

**`budget_limits`** (periodic budget caps)
```sql
id: int (PK)
budget_id: int (FK → budgets)
start_date: date
end_date: date
amount: decimal(32,12)
transaction_currency_id: int (FK)
created_at, updated_at, deleted_at
```

**`auto_budgets`** (recurring budget templates)
```sql
id: int (PK)
budget_id: int (FK → budgets)
transaction_currency_id: int (FK)
amount: decimal(32,12)
period: string  -- 'weekly', 'monthly', 'quarterly', 'half_year', 'yearly'
created_at, updated_at, deleted_at
```

#### Savings Goals (Piggy Banks):

**`piggy_banks`**
```sql
id: int (PK)
account_id: int (FK → accounts)
name: string
target_amount: decimal(32,12)
current_amount: decimal(32,12)
start_date: date
target_date: date
order: int
active: boolean
created_at, updated_at, deleted_at
```

**`piggy_bank_events`** (audit trail)
```sql
id: int (PK)
piggy_bank_id: int (FK)
transaction_journal_id: int (FK)
date: date
amount: decimal(32,12)
created_at, updated_at
```

#### Recurring Transactions:

**`recurrences`**
```sql
id: int (PK)
user_id: int (FK)
transaction_type_id: int (FK)
title: string
description: text
first_date: date
repeat_until: date
latest_date: date
repetitions: int (nullable)
apply_rules: boolean
active: boolean
created_at, updated_at, deleted_at
```

**`recurrence_repetitions`**
```sql
id: int (PK)
recurrence_id: int (FK)
repetition_type: string  -- 'daily', 'weekly', 'monthly', 'yearly', 'xxxOfM'
repetition_moment: string  -- day of week, day of month, etc.
repetition_skip: int  -- every N periods
weekend: int  -- weekend handling
```

**`recurrence_transactions`** (transaction templates)
```sql
id: int (PK)
recurrence_id: int (FK)
transaction_currency_id: int (FK)
amount: decimal(32,12)
description: string
source_id: int (FK → accounts)
destination_id: int (FK → accounts)
```

#### Audit Trail:

**`audit_log_entries`** (polymorphic)
```sql
id: int (PK)
auditable_id: int
auditable_type: string
action: string
before: json
after: json
user_id: int
created_at, updated_at, deleted_at
```

#### Multi-Currency:

**`transaction_currencies`**
```sql
id: int (PK)
name: string
code: string  -- ISO 4217
symbol: string
decimal_places: int
enabled: boolean
```

**`currency_exchange_rates`**
```sql
id: int (PK)
from_currency_id: int (FK)
to_currency_id: int (FK)
date: date
rate: decimal(32,12)
```

**Strengths:**
- Explicit, queryable schema
- Clear separation of concerns
- Robust audit trail
- Flexible recurring transaction system
- Multi-currency support

**Weaknesses:**
- More complex schema
- Requires migrations for new features
- Period tracking via date ranges can be tricky

---

### 4. Key Design Patterns

#### Pattern 1: Separate Budget Definition from Budget Period

**Anti-pattern:** Store budget amount on the budget itself
```sql
budgets: amount, period_start, period_end
```

**Better pattern:** Budget as template, periods as instances
```sql
budgets: (definition/template)
  - name, icon, color, period_type, rollover_enabled

budget_periods: (one per month/week/etc.)
  - budget_id, period_number, start_date, end_date
  - carried_over, status
```

**Why:**
- A budget can span multiple periods (e.g., "Groceries" budget repeats monthly)
- Each period gets its own instance with carryover data
- Historical tracking without mutating the template
- Easy to query "all periods for this budget" or "this specific period"

#### Pattern 2: Budget Rollover Handling

**Option A: Computed at query time (Actual Budget)**
```sql
SELECT SUM(amount) FROM transactions
WHERE category_id = ? AND date BETWEEN period_start AND period_end
```
Rollover = previous period's (limit - actual_spent)

**Pros:** No data duplication, always accurate
**Cons:** Expensive for many periods, hard to cache

**Option B: Stored per period (Recommended)**
```sql
budget_period_categories:
  - allocated_amount
  - rollover_in
  - actual_spent (cached)
  - available (allocated + rollover_in - actual_spent)
```

**Pros:** Fast queries, easy to cache, explicit history
**Cons:** Need to maintain consistency (use triggers or service layer)

**Option C: Event-sourced (Firefly III piggy_bank_events)**
Track every allocation change as an event, reconstruct state from events.

**Pros:** Complete audit trail, flexible
**Cons:** Complex queries, need to materialize state

**Recommendation for Budgeto:** Option B with recomputation as a validation step. Store `rollover_in` explicitly, update `actual_spent` on transaction insert/delete, compute `available` on read.

#### Pattern 3: Savings Goals vs Spending Budgets

**Fundamental difference:**
- **Spending budgets**: "Don't exceed X per period" → constraint-based
- **Savings goals**: "Accumulate X by date Y" → accumulation-based

**Anti-pattern:** Try to model both with the same table
```sql
budgets: type = 'spending' | 'savings'  -- confusing
```

**Better pattern:** Separate tables
```sql
-- Spending budgets (constraint-based)
budgets → budget_periods → budget_period_categories
  - limit: "spend up to $500 on groceries this month"
  - rollover: "unspent money carries forward"

-- Savings goals (accumulation-based)
savings_goals → savings_goal_events
  - target: "save $10,000 for vacation by 2025-06"
  - progress: "currently at $3,500"
  - contributions: track each deposit/withdrawal
```

**Why:**
- Different mental models require different queries
- Savings goals need progress tracking and contribution history
- Spending budgets need period-based tracking and rollover
- UI/UX will be very different

**Recommendation for Budgeto:** Separate `savings_goals` table with `savings_goal_events` for audit trail.

#### Pattern 4: Transaction Linking to Budget Periods

**Question:** How to determine which budget period a transaction belongs to?

**Approach A: Date-based (simplest)**
```sql
transaction belongs to period if:
  transaction.date BETWEEN period.start_date AND period.end_date
```

**Pros:** Simple, no schema changes needed
**Cons:** Can't handle edge cases (e.g., transaction on period boundary)

**Approach B: Explicit assignment**
```sql
transactions: budget_period_id (FK, nullable)
```

**Pros:** Flexible, can override date-based assignment
**Cons:** Need to maintain the link, UI complexity

**Approach C: Category + date (hybrid)**
Link via category membership AND date range:
```sql
transaction.category_id = budget_period_category.category_id
AND transaction.date BETWEEN period.start_date AND period.end_date
```

**Pros:** Explicit category linkage, date-based period matching
**Cons:** More complex joins

**Recommendation for Budgeto:** Start with Approach A (date-based), add explicit override later if needed. Most budget apps use date-based matching.

#### Pattern 5: Multi-Currency Support

**Pattern (from Firefly III):**
```sql
-- Store amounts in native currency
transactions:
  amount: numeric(12,2)
  currency_id: int (FK → currencies)

-- Convert for reporting
-- Use exchange rates as of transaction date
currency_exchange_rates:
  from_currency_id, to_currency_id, date, rate

-- Budget limits per currency
budget_period_categories:
  allocated_amount: numeric(12,2)
  currency_id: int (FK)
```

**Key principles:**
1. **Store in native currency**: Don't normalize at write time
2. **Convert at read time**: Use exchange rates for display/reporting
3. **Support multiple currencies per budget**: User may have USD and EUR budgets

**Recommendation for Budgeto:** Already have `currency` on wallets. For budgets, store `currency_code` on budget definition. Support multi-currency wallets/budgets from the start to avoid schema churn later.

#### Pattern 6: Budget Templates (Auto-population)

**Use case:** User sets up "Groceries: $500/month" and wants it to auto-populate future months.

**Pattern (from Actual Budget goals + Firefly III auto_budgets):**
```sql
budget_templates:
  id, budget_id, category_id,
  template_type: 'fixed' | 'copy_previous' | 'percentage_of_income' | 'spend_down'
  template_value: numeric  -- amount or percentage
  target_date: date  -- for 'spend_down' type
  active: boolean
```

**How it works:**
- User creates a budget with a template
- System auto-populates future periods based on template rules
- User can override individual periods

**Recommendation for Budgeto:** Implement `budget_templates` table. Support at least:
- `fixed`: Set a fixed amount each period
- `copy_previous`: Copy previous period's allocation
- `percentage_of_income`: Allocate X% of income

#### Pattern 7: Audit Trail

**Pattern (from Firefly III):**
```sql
audit_log_entries:
  id, entity_type, entity_id,  -- polymorphic
  action: 'create' | 'update' | 'delete'
  changed_fields: jsonb  -- what changed
  before_value: jsonb  -- snapshot before
  after_value: jsonb  -- snapshot after
  user_id, created_at
```

**Why:**
- Track who changed what and when
- Allow undo/redo
- Compliance and debugging
- User trust ("show me my history")

**Recommendation for Budgeto:** Implement `audit_log_entries` table using PostgreSQL JSONB for flexible before/after snapshots.

#### Pattern 8: Income vs Expense Budgets

**Question:** Should income budgets be separate from expense budgets?

**Approach A: Separate tables**
```sql
income_budgets, expense_budgets
```

**Pros:** Clear separation
**Cons:** Schema duplication, harder to query totals

**Approach B: Unified with type field**
```sql
budgets: type = 'income' | 'expense'
```

**Pros:** Single table, easier to query
**Cons:** Need to filter by type everywhere

**Approach C: Follow category type**
Categories already have `type = 'income' | 'expense'`. Budgets link to categories, so budgets inherit the type.

**Recommendation for Budgeto:** Use Approach C. Budgets don't need a type field — they link to categories, and categories have types. This keeps the schema clean.

---

### 5. Recommended Schema for Budgeto

Based on the research, here's the recommended schema evolution:

#### New Tables:

**`budget_periods`** (period instances)
```sql
id: uuid (PK)
budget_id: uuid (FK → budgets)
period_number: int  -- 1, 2, 3... nth period
start_date: date
end_date: date
carried_over: numeric(12,2)  -- amount from previous period (if rollover enabled)
status: text  -- 'active', 'closed', 'projected'
created_at, updated_at
```

**`budget_period_categories`** (category allocation per period)
```sql
id: uuid (PK)
budget_period_id: uuid (FK → budget_periods)
category_id: uuid (FK → categories)
allocated_amount: numeric(12,2)
rollover_in: numeric(12,2)  -- unspent from previous period
actual_spent: numeric(12,2)  -- cached sum of transactions
available: numeric(12,2)  -- allocated + rollover_in - actual_spent
created_at, updated_at
unique: (budget_period_id, category_id)
```

**`savings_goals`** (accumulation-based goals)
```sql
id: uuid (PK)
user_id: uuid (FK → users)
name: text
description: text
icon: text
color: text
target_amount: numeric(12,2)
current_amount: numeric(12,2)
target_date: date (nullable)
start_date: date
status: text  -- 'active', 'completed', 'paused'
created_at, updated_at
```

**`savings_goal_events`** (contribution audit trail)
```sql
id: uuid (PK)
savings_goal_id: uuid (FK → savings_goals)
transaction_id: uuid (FK → transactions, nullable)
amount: numeric(12,2)  -- positive = deposit, negative = withdrawal
note: text
created_at
```

**`budget_templates`** (auto-population rules)
```sql
id: uuid (PK)
budget_id: uuid (FK → budgets)
category_id: uuid (FK → categories)
template_type: text  -- 'fixed', 'copy_previous', 'percentage_of_income', 'spend_down'
template_value: numeric(12,2)  -- amount or percentage
target_date: date (nullable, for 'spend_down')
active: boolean
created_at, updated_at
```

**`audit_log_entries`** (polymorphic audit trail)
```sql
id: uuid (PK)
entity_type: text  -- 'budget', 'transaction', 'category', etc.
entity_id: uuid
action: text  -- 'create', 'update', 'delete'
changed_fields: jsonb
before_value: jsonb
after_value: jsonb
user_id: uuid (FK → users)
created_at
```

**`currencies`** (multi-currency support)
```sql
id: uuid (PK)
code: text  -- ISO 4217 (e.g., 'USD', 'EUR')
name: text
symbol: text
decimal_places: int
enabled: boolean
```

**`currency_exchange_rates`**
```sql
id: uuid (PK)
from_currency_id: uuid (FK → currencies)
to_currency_id: uuid (FK → currencies)
rate_date: date
rate: numeric(12,6)
unique: (from_currency_id, to_currency_id, rate_date)
```

#### Modified Tables:

**`budgets`** (add fields)
```sql
-- Add:
rollover_enabled: boolean (default true)
is_template: boolean (default false)
parent_budget_id: uuid (FK → budgets, nullable)  -- for template → instance
currency_code: text  -- ISO 4217
```

**`transactions`** (add field for budget period override)
```sql
-- Add (optional, for edge cases):
budget_period_id: uuid (FK → budget_periods, nullable)
```

---

### 6. Period Handling Recommendations

#### Period Types:
- **Weekly**: start_date = Monday, end_date = Sunday
- **Monthly**: start_date = 1st, end_date = last day of month
- **Quarterly**: 3-month periods
- **Yearly**: Jan 1 - Dec 31
- **Custom**: user-defined date ranges

#### Period Generation:
When a user creates a budget with `period_type = 'monthly'`:
1. Create the `budget` record
2. Generate `budget_period` records for each month (e.g., next 12 months)
3. For each period, create `budget_period_categories` based on the budget's categories
4. Apply templates if defined

#### Rollover Logic:
At period close:
```sql
-- For each budget_period_category:
unspent = allocated_amount + rollover_in - actual_spent
next_period.rollover_in = unspent (if rollover_enabled)
```

---

### 7. Transaction-to-Budget Linking

#### Default: Date-based matching
```sql
-- Find budget period for a transaction:
SELECT * FROM budget_periods bp
JOIN budget_period_categories bpc ON bpc.budget_period_id = bp.id
WHERE bpc.category_id = :transaction_category_id
  AND :transaction_date BETWEEN bp.start_date AND bp.end_date
```

#### Update actual_spent:
```sql
-- On transaction insert:
UPDATE budget_period_categories bpc
SET actual_spent = actual_spent + :transaction_amount
FROM budget_periods bp
WHERE bpc.budget_period_id = bp.id
  AND bpc.category_id = :transaction_category_id
  AND :transaction_date BETWEEN bp.start_date AND bp.end_date

-- Recompute available:
UPDATE budget_period_categories
SET available = allocated_amount + rollover_in - actual_spent
```

---

### 8. Implementation Recommendations

#### Phase 1: Core Budget Tracking
- Implement `budget_periods` and `budget_period_categories`
- Date-based transaction matching
- Rollover computation
- Basic period generation (monthly)

#### Phase 2: Savings Goals
- Implement `savings_goals` and `savings_goal_events`
- Contribution tracking
- Progress visualization

#### Phase 3: Budget Templates
- Implement `budget_templates`
- Auto-population of future periods
- Template types: fixed, copy_previous

#### Phase 4: Advanced Features
- Multi-currency support (`currencies`, `currency_exchange_rates`)
- Audit trail (`audit_log_entries`)
- Custom period types (weekly, quarterly, yearly)
- Income budgets (follow category type)

---

### 9. Key Takeaways

1. **Separate definition from instance**: Budgets as templates, periods as instances
2. **Store native amounts**: Don't normalize currencies at write time
3. **Explicit rollover tracking**: Store carried amounts, don't just compute
4. **Savings goals are different**: Separate tables, different mental model
5. **Audit everything**: JSONB snapshots for flexible history
6. **Use date ranges**: Not month numbers — supports custom periods
7. **Template rules**: Allow auto-population from templates
8. **Soft deletes**: Use `deleted_at` for audit preservation (tombstone pattern)
9. **Integer amounts**: Consider storing as integers (cents) to avoid floating-point errors
10. **Follow category type**: Income vs expense budgets follow category type, not budget type

---

## References

- **Actual Budget**: https://github.com/actualbudget/actual
  - Spreadsheet-based approach
  - Integer amounts (cents)
  - Month-keyed budgets
  - Goals as notes

- **Firefly III**: https://github.com/firefly-iii/firefly-iii
  - Traditional relational schema
  - BudgetLimit for period tracking
  - AutoBudget for templates
  - PiggyBank for savings goals
  - Polymorphic audit log
  - Multi-currency support

- **YNAB**: (proprietary, patterns inferred from documentation)
  - Envelope budgeting
  - Strict rollover
  - Category-based allocation

- **Mint**: (proprietary, patterns inferred from documentation)
  - Spending limits
  - No rollover by default
  - Category-based tracking

---

## Next Steps

1. Review this research with the team
2. Decide on implementation phases
3. Write detailed specs for Phase 1 (core budget tracking)
4. Design API endpoints for budget period management
5. Plan migration strategy for existing `budgets` and `budget_categories` tables
