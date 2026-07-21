### Story 1.1: Budgets with multiple categories, limits, icons, colors, and progress tracking

**type:** feat
**risk:** P0
**context:** domain

**Context:** The current budget feature stores one budget per category per month. Users want budgets as first-class entities with their own name, icon, and color, grouping multiple categories each with an individual limit. Progress tracking must show spent and remaining per category and for the whole budget. A dedicated chart view is deferred to a future story.

## Requirements

#### ADDED: Budget is a first-class entity with metadata

A budget has a `name`, `icon`, `color`, `period` (monthly/yearly/custom), `startDate`, and `endDate`.

#### ADDED: Budget contains multiple categories with individual limits

A budget can reference many expense categories. Each link stores a `limitAmount`. A category can belong to multiple budgets.

#### ADDED: Allocation validation

The sum of category limits within a budget cannot exceed the budget's total amount. This is enforced on create and update.

#### ADDED: CRUD API for budgets with categories

Server exposes `POST /budgets`, `GET /budgets`, `GET /budgets/:id`, `PUT /budgets/:id`, `DELETE /budgets/:id`. Requests and responses include the budget metadata and category list with limits.

#### ADDED: Progress tracking

Responses include `spent`, `remaining`, and `percentage` per category and overall, calculated from transactions whose date falls within the budget period and whose category matches a budget category.

#### ADDED: UI for creating and editing multi-category budgets

The Budgets page lets users add a budget, pick icon/color, set period, and add/remove categories with limits. The list shows per-budget and per-category progress.

## Out of scope

- Dedicated chart view for budgets (future story).
- Budget status (active/paused/archived).
- Rollover of unused amounts.
- Soft/hard limit alerts and notifications.
- Recurring budgets.

## Risks

- **Schema migration:** Existing `budgets` table is in-flight only. Migration can drop and recreate without data loss concerns, but must be applied cleanly in dev and test databases.
- **Transaction date handling:** Progress must respect the budget period; edge cases include inclusive start/end dates and time zones.
- **Client UI complexity:** Multi-category form is more complex than the current single-category form; validation errors must be clear.

## Verification Script (Step-by-Step)

1. Run `npm run db` to start the database and apply migrations.
2. Run `npm test` to confirm all server and client tests pass.
3. Run `npm run build` and `npm run lint` to confirm green gates.
4. Open the Budgets page, create a budget with two categories, set limits, and verify progress updates after adding matching transactions.
