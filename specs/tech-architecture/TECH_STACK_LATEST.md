# Budgeto — Technology Stack

# Migrated from conductor/tech-stack.md on 2026-07-13

language:
name: TypeScript
description: >
Type-safe throughout (frontend and backend) for maintainability and fewer
runtime errors.

frontend:
framework: React
type: Progressive Web App (PWA)
description: >
Component-based UI, built as a PWA (installable on Android, responsive for
web). PWA tooling (service worker + manifest) for offline-capable core views.
key_dependencies: - vite - react-router-dom - axios - lucide-react - @hookform/resolvers

backend:
runtime: Node.js
framework: Express
description: >
REST API serving the React PWA. Written in TypeScript with a four-layer
pattern: router → controller → service → repository.
key_dependencies: - express - pg - drizzle-orm - zod - bcryptjs - jsonwebtoken - cors - dotenv

database:
engine: PostgreSQL
orm: Drizzle ORM (drizzle-orm/node-postgres)
production_provider: Neon (managed/serverless PostgreSQL)
description: >
Neon is wire-compatible with PostgreSQL and the app connects via the standard
pg driver using DATABASE_URL. The same code runs locally (embedded PostgreSQL)
and in production (Neon) without changes.

local_development:
tool: embedded-postgres
reason: >
The target environment cannot provision a PostgreSQL server (no root/sudo
access, no Docker). The embedded-postgres package downloads and launches a
real PostgreSQL binary as the current (non-root) user for local development
and automated tests.

testing:
framework: vitest
client_environment: jsdom
server_environment: node
integration: supertest
coverage_threshold: 80%

code_quality:
linter: ESLint
formatter: Prettier
type_checker: tsc --noEmit

source: conductor/tech-stack.md
