# Category Management System

## Overview
Implement a full CRUD category management system that allows users to create, view, edit, and delete categories for organizing their expenses and income. Categories are user-scoped (shared across all wallets) and managed from the Settings section of the application.

Each category has a name, an income/expense type designation, a color (stored as a hex code string), and an icon selected from a widely-used icon library. The icon visually inherits the category's chosen color.

## Functional Requirements

### FR-1: Category CRUD Operations
- **FR-1.1 Create:** Users can create a new category by providing a name, selecting an income/expense type, choosing a color, and picking an icon.
- **FR-1.2 Read:** Users can view a list of all their categories, displayed with their name, type indicator, color, and icon.
- **FR-1.3 Update:** Users can edit any property of an existing category (name, type, color, icon).
- **FR-1.4 Delete:** Users can delete a category they no longer need.

### FR-2: Category Properties
Each category must contain:
- **Name** (string, required): A descriptive label (e.g., "Groceries", "Salary").
- **Type** (enum, required): Either "income" or "expense".
- **Color** (string, required): A color code stored as a hex string (e.g., `#FF5733`).
- **Icon** (string, required): An icon identifier from the chosen icon library. The icon renders in the category's assigned color.

### FR-3: Category Scope
- Categories are **user-scoped** -- each user manages their own independent set of categories, shared across all wallets.

### FR-4: UI Integration
- Category management is accessible from the **Settings** sub-page in the application.
- The UI follows existing design patterns and components in the codebase.

### FR-5: Backend API
- RESTful API endpoints under `/api/categories` supporting all CRUD operations.
- All endpoints require authentication.
- Database schema uses Drizzle ORM with a migration.

### FR-6: Icon Library
- Use `lucide-react` (already widely adopted in the ecosystem) or an equivalent well-maintained library that provides a comprehensive set of icons suitable for financial categories.

## Non-Functional Requirements
- **Type Safety:** All code (frontend and backend) is TypeScript with full type coverage.
- **Test Coverage:** >80% test coverage for all new modules (TDD approach per workflow).
- **Responsive:** Category management UI must work correctly on mobile and desktop.

## Acceptance Criteria
1. An authenticated user can navigate to Settings > Categories and see their category list.
2. User can create a new category with name, type, color, and icon -- it appears in the list immediately.
3. User can edit a category -- changes persist and display correctly.
4. User can delete a category -- it is removed from the list.
5. Categories are properly scoped to the user (other users cannot see or modify them).
6. All API operations are protected by authentication.
7. Database migration creates the categories table correctly.

## Out of Scope
- Associating categories with specific wallets (categories are global per user for now).
- Category hierarchy/nesting (parent-child categories).
- Default/system-provided categories.
- Category budgeting (budget allocation per category is a separate future track).
