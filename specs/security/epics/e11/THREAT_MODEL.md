# Threat Model — e11: Dialog Modals & Transaction Guards

**Date:** 2026-07-15
**Reviewer:** Automated (build-epic step 0)
**Risk Level:** LOW

## Surface Area

| Component           | Change                            | Data Flow                                                                                |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| WalletModal.tsx     | Sheet→Dialog, remove mode prop    | No change — same API calls (createWallet, updateWallet, deleteWallet, getWallet)         |
| CategoryModal.tsx   | Sheet→Dialog, remove mode prop    | No change — same API calls (createCategory, updateCategory, deleteCategory, getCategory) |
| TransactionForm.tsx | categoryId mandatory, auto-select | No change — same API calls, schema change is client-side only                            |
| Home.tsx            | Button guard, nested dialogs      | No change — same data fetching and mutation patterns                                     |

## Vulnerability Categories

### Injection

- **Verdict:** N/A — no new inputs, no new API calls.

### Authentication / Authorization

- **Verdict:** N/A — API calls remain protected by existing `authenticate` middleware. No auth changes.

### Data Exposure

- **Verdict:** N/A — form fields are the same (name, description, color, type, icon). No new data collected or displayed.

### CSRF / XSS

- **Verdict:** N/A — React handles XSS via JSX escaping. No `dangerouslySetInnerHTML` introduced.

### Dependency Risk

- **Verdict:** N/A — No new npm dependencies. Dialog is already in `client/src/components/ui/dialog.tsx` (shadcn/Radix).

## Mitigation Guidance

No mitigations needed. This is a UI component refactor with zero backend or data-flow impact. Standard code review and test coverage (≥80%) are sufficient.

## Risk Level: LOW

All changes are UI-only. No security-relevant code paths are added, modified, or removed.
