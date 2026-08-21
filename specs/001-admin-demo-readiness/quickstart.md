# Quickstart: Validate Rentify Admin Demo

## Prerequisites

- PostgreSQL and required Rentify infrastructure configured through existing environment files.
- Dependencies already installed in `server` and `admin-ui`.
- Real demo records prepared through existing seed/database workflow:
  - one active admin used for login;
  - another admin to test protected status mutation;
  - at least one guest and one host;
  - properties with verified, missing and unverified licenses, including a `requiresLocalLicense=false` property to prove license verification is still mandatory for activation;
  - at least two pending KYC documents;
  - platform/revenue/VND ledger account or a known empty-state fixture.

Do not add hard-coded demo arrays to Admin UI.

### Authorized development demo seed

The development database may be empty and the application has no administrator bootstrap endpoint. T043 therefore authorizes a reproducible server-side seed command that is development-only and idempotent. It must not run in production, reset/delete existing data, add a migration, or use real identity/payment artifacts.

From `server`, set the local database URL and opt-in/password variables, then run:

```powershell
$env:NODE_ENV = 'development'
$env:ALLOW_DEMO_SEED = 'true'
$env:DATABASE_URL = '<local-development-database-url>'
$env:DEMO_ADMIN_PASSWORD = '<secret>'
$env:DEMO_SECOND_ADMIN_PASSWORD = '<secret>'
$env:DEMO_GUEST_PASSWORD = '<secret>'
$env:DEMO_HOST_PASSWORD = '<secret>'
npm run seed:demo
```

Demo emails:

- `admin.demo@rentify.test` — password from `DEMO_ADMIN_PASSWORD`
- `admin.secondary.demo@rentify.test` — password from `DEMO_SECOND_ADMIN_PASSWORD`
- `guest.demo@rentify.test` — password from `DEMO_GUEST_PASSWORD`
- `host.demo@rentify.test` — password from `DEMO_HOST_PASSWORD`

The command prints only a record-count summary and the demo emails; it never prints password values.

### T043 validation

- Prisma migration status against the development database on host port `54332` — PASS; all 3 migrations applied and schema up to date.
- Focused demo-seed contract tests — PASS (1 suite, 7 tests), covering production refusal, explicit opt-in, all required password variables, role assignment and deterministic account keys.
- Read-only ESLint for `src/demo-seed.ts`, `src/seed-demo.ts` and `src/demo-seed.spec.ts` — PASS.
- `npx tsc -p tsconfig.build.json --incremental false` — PASS.
- First `npm run seed:demo` — PASS with 4 accounts (2 admin, 1 guest, 1 host), 1 verified host KYC profile, 1 pending KYC document, 1 demo property, 1 verified property license, 1 platform/revenue/VND ledger account and 1 balance record.
- Second `npm run seed:demo` — PASS with identical counts, proving the deterministic upserts/lookups do not duplicate the required dataset.
- Full server tests after seeding — PASS (16 suites, 99 tests).
- No migration, dependency, database reset/delete, UI fixture, real identity artifact, payment credential, SePay token or ngrok token was added or used.
- T043 status: COMPLETE.

## Validation Log

### Gate 1 — Admin platform balance

- Changed-file read-only ESLint — PASS for the admin ledger controller, controller spec and ledger module.
- Focused admin ledger controller tests — PASS (1 suite, 6 tests).
- Full server tests — PASS (11 suites, 43 tests).
- Initial `npm run build` — FAIL because the generated Prisma Client was stale/missing after rebase.
- `npx prisma generate` — PASS; generated Prisma Client v7.8.0 from `server/prisma/schema.prisma`. No migrate, db push, db reset or seed command was run.
- Retried `npm run build` — PASS.
- Gate 1 status: COMPLETE.

### Phase 2 progress

- Focused account-status invariant tests — PASS (1 suite, 5 tests).
- Read-only ESLint for the three account-status invariant files — PASS after scoped formatting.
- Full server tests after the account-status invariant — PASS (12 suites, 48 tests).
- Server build after the account-status invariant — PASS.
- Admin account status-route authorization test — PASS (1 suite, 5 tests); its read-only ESLint also passed.
- T010–T011 new property-activation implementation/test block — lint-clean by scoped diff inspection; focused listings tests PASS (1 suite, 16 tests), full server tests PASS (13 suites, 60 tests), and server build PASS.
- Baseline debt retained in the untouched legacy portion of `listings.usecases.spec.ts`: 13 read-only ESLint findings (`require-await` at lines 57, 61, 162, 238, 312, 434 and `unbound-method` at lines 100–102, 181, 254, 320, 441 after the scoped diff). These findings predate the T010–T011 block and were not rewritten.
- T012 admin listings authorization — scoped ESLint PASS; focused tests PASS (1 suite, 15 tests).
- T013–T014 KYC invariants — scoped ESLint PASS; focused tests PASS (1 suite, 9 tests).
- T015 admin KYC authorization — scoped ESLint PASS; focused tests PASS (1 suite, 10 tests).
- Gate 2 combined focused tests — PASS (6 suites, 60 tests).
- Gate 2 full server tests — PASS (15 suites, 92 tests).
- Gate 2 server build — PASS.
- Repository lint script was not run because it invokes ESLint with `--fix`; every changed file received read-only scoped ESLint, with the unchanged listings legacy findings documented above.
- Gate 2 status: COMPLETE.

### Gate 3 — Authentication shell

- Scoped read-only ESLint on all six changed auth-shell files — PASS.
- Admin UI production build — PASS after allowing the existing `next/font` configuration to fetch Geist/Geist Mono; compile, TypeScript, page data and eight static pages completed.
- Verified by implementation inspection: login idle/loading/validation/authentication/access-denied/success redirect paths, 401 session clearing, 403 session preservation, protected-content gating and guest/host role denial.
- Real credential/API interaction remains part of the integrated authorization matrix and smoke test because no running demo API credentials were supplied at this gate.
- Gate 3 status: COMPLETE for automated validation; integrated real-API verification remains mandatory at Gate 8.

### Gate 4 — Real-data Overview

- Scoped read-only ESLint on all seven changed Overview/query files — PASS.
- Static scan found no mock records, Recent Bookings, Meilisearch control or former hard-coded KPI values in the Overview container.
- Admin UI production build — PASS, including TypeScript and eight statically generated pages.
- Overview now reads platform balance, total users, total properties and pending KYC from protected real APIs with independent loading, empty/unavailable, error/retry, unauthorized and success rendering.
- Real-data value comparison remains mandatory in the Gate 8 smoke test.
- Gate 4 status: COMPLETE.

### Gate 5 — Users

- Scoped read-only ESLint on every changed Users file — PASS.
- Focused server account invariant and route authorization tests — PASS (2 suites, 10 tests).
- Admin UI production build — PASS, including TypeScript and static generation.
- Users list now separates loading/empty/error/retry/unauthorized/success; filters reset page; admin rows expose no mutation action; guest/host changes require confirmation and use backend messages/invalidation/stale refetch.
- Persisted real-data interaction remains mandatory at Gate 8.
- Gate 5 status: COMPLETE.

### Gate 6 — Properties and licenses

- Scoped read-only ESLint on every changed Properties file — PASS with 0 errors; one existing Next.js `<img>` optimization warning remains in the property table and was not rewritten.
- Focused listings invariant and authorization tests — PASS (2 suites, 31 tests).
- Server build — PASS.
- Admin UI production build — PASS, including TypeScript and static generation.
- Properties now separates five list states, always exposes license inspection with empty/error/invalid-URL handling, requires status confirmation, removes the out-of-scope search sync control and surfaces backend activation prerequisites.
- Persisted real-data interaction remains mandatory at Gate 8.
- Gate 6 status: COMPLETE.

### Gate 7 — KYC

- Scoped read-only ESLint on all five changed KYC UI files — PASS.
- Focused KYC review and admin-route tests — PASS (2 suites, 19 tests).
- Admin UI production build — PASS, including TypeScript and static generation. The sandboxed attempt could not fetch Google Fonts; the identical build passed with network access.
- KYC now separates queue loading/empty/error/retry/unauthorized/success, requires explicit approve and reject confirmation, trims and validates rejection reasons, locks pending actions, surfaces backend messages, and refetches stale/conflicting queue data.
- No backend KYC files changed during the scoped lifecycle fix, so the conditional server build was not required for this gate.
- Persisted real-data interaction remains mandatory at Gate 8.
- Gate 7 status: COMPLETE.

## Phase Validation

From `server` after each backend phase:

```powershell
npm test -- --runInBand
npm run lint
npm run build
```

When an HTTP test environment is available:

```powershell
npm run test:e2e
```

From `admin-ui` after each frontend phase:

```powershell
npm run lint
npm run build
```

## Authorization Matrix

Exercise accounts list/status, properties list/license/status, KYC pending/review and platform balance:

| Credential            | Expected                                        |
| --------------------- | ----------------------------------------------- |
| No token              | 401, no protected data                          |
| Invalid/expired token | 401, Admin UI clears session and requests login |
| Guest token           | 403, no protected data                          |
| Host token            | 403, no protected data                          |
| Admin token           | Contract-specific success                       |

Additional invariant checks:

- Admin updates guest/host status: allowed for valid transition.
- Admin updates own admin status: 403; persisted status unchanged.
- Admin updates another admin status: 403; persisted status unchanged.

## Main Demo Script

1. Open Admin UI and log in with active admin credentials.
2. Verify Overview loads platform balance, total users, total properties and pending KYC count from real APIs, provides navigation shortcuts, and contains no other KPI or recent bookings.
3. Open Users, search/filter, attempt a guest/host status change, cancel once, then confirm; verify toast and refreshed persisted status.
4. Verify an admin row has no usable status action.
5. Open Properties, search/filter, inspect a license and its empty/error alternatives, cancel then confirm a valid status change.
6. Open KYC, inspect a document, cancel then confirm approval.
7. Reject another KYC document: verify blank reason is blocked, provide reason, confirm, and verify queue refresh.
8. Reload each screen and confirm all successful mutations persist.
9. Repeat protected API calls with guest/host tokens to verify backend denial.

## Five-State UI Matrix

For Overview balance, Users list, Properties list/license, and KYC queue/review verify:

- Loading: visible progress/skeleton; no false empty or zero.
- Empty: explicit no-data/no-result message and filter recovery where applicable.
- Error: distinct from empty, useful message, retry when safe.
- Unauthorized: protected data hidden; 401 login recovery and 403 access denied.
- Success: real API data rendered; actions reflect current server state.

For Login verify idle, loading, validation error, authentication error, unauthorized and success redirect. Login has no empty-state requirement.

## Release Gate

The feature is demo-ready only when:

- server and admin-ui builds pass;
- applicable lint/tests pass or every exception is recorded with impact;
- main demo script completes without serious runtime error;
- authorization matrix passes;
- no mock/hard-coded Admin business records remain;
- targeted guest/host regression checks pass.

### T044 — API authorization matrix

- All four demo-account logins returned HTTP 201.
- Every protected Admin accounts, properties, property-license, KYC and platform-ledger route returned HTTP 401 without a token and with an invalid token.
- Every protected Admin route returned HTTP 403 for guest and host tokens.
- Admin reads and valid guest/host status mutations succeeded; mutation of an admin account returned HTTP 403.
- Property activation with verified host KYC and verified license succeeded, and the property was restored to paused status.
- Both administrator accounts were accepted, and the generic ledger endpoint contract was not changed.
- T044 status: COMPLETE.

### T045 — Manual browser smoke evidence

- Manual smoke test passed at `http://localhost:3001`; no browser automation was used.
- Admin login succeeded and the Dashboard displayed real API metrics.
- Users loaded successfully and admin-account mutation protections worked.
- Properties and license information loaded correctly; KYC queue and review dialogs worked.
- Admin ledger/revenue data loaded correctly.
- Logout, protected-route redirect, re-login, refresh and session persistence worked.
- T045 status: COMPLETE.

### T046–T047 — Final validation stop

- Targeted guest/host and Admin authorization regression tests — PASS (5 suites, 38 tests).
- Static scan of `admin-ui/src` — PASS; no mock, fixture, fake, demo-account or hard-coded Admin business records found. The only local endpoint literal is the intentional development fallback `http://127.0.0.1:8080` when `NEXT_PUBLIC_API_URL` is omitted; cause: local development convenience, impact: production must provide `NEXT_PUBLIC_API_URL`.
- Admin UI read-only ESLint — FAIL in `admin-ui/src/features/users/components/user-status-badge.tsx:7` with `prettier/prettier`; one existing `<img>` optimization warning was also reported in `properties-table.tsx:128`.
- Validation stopped at the first actual failure. T046 status: INCOMPLETE.
- T047 release decision: **FAIL — NOT DEMO-READY** until the Admin UI lint error is resolved and the remaining Gate 8 checks pass.
