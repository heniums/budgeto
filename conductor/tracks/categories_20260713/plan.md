# Implementation Plan: Category Management System

## Phase 1: Backend – Database Schema & Migration [checkpoint: 664f2b0]

- [x] Task: Define categories table in Drizzle schema [fcb6aaa]
    - [x] Write tests for categories table schema shape and constraints
    - [x] Add `category` table (id uuid PK, user_id FK, name text NOT NULL, type text NOT NULL, color text NOT NULL, icon text NOT NULL, created_at, updated_at) to `server/src/db/schema.ts`
    - [x] Run Drizzle migration to create the table
- [x] Task: Conductor - User Manual Verification 'Backend - Database Schema & Migration' (Protocol in workflow.md)

## Phase 2: Backend – Categories CRUD API

- [ ] Task: Write tests for categories API endpoints (Red phase)
    - [ ] POST /categories – create category with name, type, color, icon, returns 201
    - [ ] GET /categories – list user's categories, returns 200
    - [ ] GET /categories/:id – get single category, returns 200
    - [ ] PUT /categories/:id – update category properties, returns 200
    - [ ] DELETE /categories/:id – delete category, returns 204
    - [ ] Auth required on all endpoints (401 without token)
    - [ ] Input validation errors (400 with invalid data)
    - [ ] Ownership enforcement (404/403 for another user's category)
- [ ] Task: Implement categories repository (Drizzle data-access layer)
    - [ ] createCategory, findCategoriesByUserId, findCategoryById, updateCategory, deleteCategory
- [ ] Task: Implement categories service (validation + business logic)
    - [ ] Zod schema for create/update category input (name required, type enum income/expense, color hex string, icon string)
    - [ ] Ownership check (user can only access own categories)
- [ ] Task: Implement categories controller (HTTP handlers)
    - [ ] createHandler, listHandler, getHandler, updateHandler, deleteHandler
- [ ] Task: Register categories routes in app.ts (all under /categories, auth-protected)
- [ ] Task: Conductor - User Manual Verification 'Backend - Categories CRUD API' (Protocol in workflow.md)

## Phase 3: Frontend – Category Management UI

- [ ] Task: Install icon library dependency (lucide-react)
- [ ] Task: Write frontend API client module for categories
    - [ ] createCategory, getCategories, getCategory, updateCategory, deleteCategory using shared Axios client
- [ ] Task: Write tests for Categories page
    - [ ] Renders list of categories with name, type badge, color, and icon
    - [ ] Empty state when no categories exist
    - [ ] Delete category with confirmation dialog
- [ ] Task: Write tests for CategoryForm component
    - [ ] Form fields: name, type toggle (expense/income), color picker, icon selector
    - [ ] Validation – name required, type required
    - [ ] Submit creates a new category
    - [ ] Submit updates an existing category (edit mode)
    - [ ] Icon preview renders in the selected color
- [ ] Task: Implement categories API client module
- [ ] Task: Implement Categories page
- [ ] Task: Implement CategoryForm component
- [ ] Task: Add categories route to client router (/account/categories, /account/categories/new, /account/categories/:id/edit)
- [ ] Task: Conductor - User Manual Verification 'Frontend - Category Management UI' (Protocol in workflow.md)
