# Budgeto

A personal finance & budgeting PWA. Track multiple wallets, categorize transactions, set per-category budget limits, and transfer between wallets — all in a clean, installable web app.

**Live demo:** <https://budgeto.heniums.vercel.app>

---

## Features

- **Multi-wallet tracking** — each wallet with its own currency (150+ supported)
- **Categorized transactions** — income and expenses with custom colored categories
- **Wallet-to-wallet transfers** — paired transactions in a single atomic operation
- **Budget management** — set per-category spending limits with monthly or custom periods
- **Balance adjustment** — correct wallet balances with a full audit trail
- **Server-side filtering** — by wallet, category, date range, and text search with infinite scroll
- **PWA** — installable on mobile and desktop, works offline
- **Onboarding wizard** — guides first-time users through initial setup

## Tech stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | React 18, TypeScript, Tailwind CSS, shadcn/ui     |
| Backend    | Express, TypeScript                               |
| Database   | PostgreSQL (Neon in production, embedded for dev) |
| ORM        | Drizzle ORM with generated migrations             |
| Forms      | react-hook-form + Zod validation                  |
| Testing    | Vitest, supertest, Testing Library (~400 tests)   |
| Deployment | Vercel (frontend), Neon (database)                |

## Development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
git clone https://github.com/heniums/budgeto.git
cd budgeto
npm install
cp .env.example .env
```

### Run

```bash
# Full stack (server + client + optional embedded PostgreSQL)
npm run dev

# With embedded local PostgreSQL (no external DB needed)
npm run dev -- --lcdb
```

The server runs on port 3000, the client on port 5173.

### Other commands

```bash
npm test            # Run all tests (server + client)
npm run test:watch  # Watch mode
npm run lint        # ESLint (zero warnings allowed)
npm run build       # Type-check + bundle
npm run db          # Start embedded PostgreSQL on port 5433
npm run db:migrate  # Run Drizzle migrations
```

## Project structure

```
budgeto/
├── client/src/          # React SPA
│   ├── pages/           # Route pages (Home, Budgets, SignIn, etc.)
│   ├── components/      # UI components + shadcn/ui primitives
│   ├── api/             # Axios client with JWT interceptor
│   ├── auth/            # AuthContext, route guards
│   ├── lib/             # Utilities (currencies, date ranges, transfers)
│   └── hooks/           # Custom hooks
├── server/src/          # Express API
│   ├── auth/            # JWT auth (register, login, profile, change-password)
│   ├── wallets/         # Wallet CRUD + balance adjustment
│   ├── categories/      # Category CRUD
│   ├── transactions/    # Transaction CRUD + transfers
│   ├── budgets/         # Budget management with period computation
│   └── db/              # Drizzle schema + pool client
├── server/migrations/   # Generated SQL migrations
├── scripts/             # Dev orchestration + embedded PostgreSQL
└── specs/               # Product specs and epics
```

## License

MIT
