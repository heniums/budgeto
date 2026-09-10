# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + TypeScript + Tailwind CSS + shadcn/ui (frontend), Express + TypeScript (backend), PostgreSQL via Drizzle ORM. PWA with Workbox. Deployed on Vercel (frontend) and Neon (database).

## Users

Individual managing personal finances — one person tracking their own income, expenses, savings, and multiple accounts.

## Product Purpose

Budgeto gives individuals a single, installable app to track multiple wallets (each with potentially different currencies), categorize every transaction, set per-category spending limits, and transfer between accounts — with a full audit trail and no vendor lock-in.

## Positioning

Multi-wallet with per-wallet currency. Unlike single-account trackers, Budgeto lets users model their full financial life — checking, savings, travel cards, petty cash — each with its own currency, all consolidated into category budgets that span wallets.

## Operating Context

- User logs in and sees a dashboard of their wallets and budget progress
- Transaction entry is fast: amount, category, wallet, optional note
- Wallet-to-wallet transfers are a single atomic operation (paired debit/credit)
- Budgets are set per category with monthly or custom periods; progress is visible in real time
- Balance adjustments correct errors and preserve the audit trail
- Works offline once installed (PWA)
- First-run onboarding wizard walks through initial wallet and category setup

## Capabilities and Constraints

- 150+ ISO 4217 currencies supported via Intl.NumberFormat
- Signed transaction amounts: positive = income, negative = expense
- Category type is implicit from amount sign (no explicit type field)
- Wallet balance is computed on-the-fly (SUM of transactions), not denormalized
- Transfers create paired transactions in a single DB transaction; source and target must differ
- Balance adjustments use FOR UPDATE row lock against an auto-created per-user "Balance Adjustment" category
- Budget periods (monthly/custom) computed via dayjs, not stored
- Ownership enforced: resource.userId === req.user.sub → 404 on mismatch
- JWT Bearer auth: short-lived access token in client memory (sent as `Authorization: Bearer`); long-lived refresh token in `httpOnly` cookie (`budgeto_refresh_token`)
- Embedded PostgreSQL available for local dev (no external DB needed)


## Brand Commitments

Memphis-style illustration aesthetic with finance-green tint: cream canvas (`hsl(60 30% 96%)`), near-black 2px ink strokes, hard offset drop shadows, finance-green primary (`hsl(152 76% 38%)`), and a yellow accent (`hsl(48 96% 56%)`) for the floating action button and net-cash signals. Display typography uses Fraunces (system fallback).

## Evidence on Hand

- Live demo: https://budgeto.heniums.vercel.app
- GitHub: https://github.com/heniums/budgeto
- Feature set documented in README.md
- Existing landing page (Landing.tsx) with feature cards and CTA
- Onboarding wizard for first-run setup

## Product Principles

1. **Own your data** — PostgreSQL backend, no vendor lock-in, works offline.
2. **Friction-free entry** — Transaction logging must be faster than the habit it supports.
3. **Budgets over bookkeeping** — Users set goals, not just record history.
4. **Currency parity** — Every wallet is a first-class financial object regardless of currency.
5. **Audit everything** — No silent corrections; every balance change leaves a trace.
