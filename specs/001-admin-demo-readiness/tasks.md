# Tasks: Rentify Admin Demo Readiness

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [admin-api.openapi.yaml](./contracts/admin-api.openapi.yaml)
**Baseline**: `HEAD ba924ea` over `origin/main fcf558d`
**Scope**: No migrations, dependencies, analytics, booking management, rewrites, or unrelated features. All tasks are P1. `[P]` means parallel-safe only after the preceding gate.

## Phase 1 — Small Admin-Only Ledger Boundary

- [x] T001 [US2] Record in `specs/001-admin-demo-readiness/research.md` that `admin-ui/src/features/ledger/services/ledger-service.ts` is the only repository consumer of `/ledger/accounts/balance`; preserve `server/src/modules/ledger/presentation/controllers/ledger.controller.ts` unchanged.
- [x] T002 [US2] Create `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.ts` with guarded/admin-authorized `GET /admin/ledger/platform-balance` and fixed `GetBalanceCommand(null, 'platform', null, 'revenue', 'VND')`; reuse the existing use case, mapper, and response wrapper.
- [x] T003 [US2] Register `AdminLedgerController` in `server/src/modules/ledger/ledger.module.ts` without changing providers, persistence, schema, or the generic ledger controller.
- [x] T004 [US2] Create `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.spec.ts` for fixed selector, admin success, no-token 401, guest 403, and host 403; retain `server/src/modules/ledger/application/use-cases/get-balance.usecase.spec.ts` as regression coverage.
- [x] T005 [CORE] Align `specs/001-admin-demo-readiness/contracts/admin-api.openapi.yaml` with the fixed admin route and unchanged generic route.
- [x] T006 [CORE] **Gate 1**: run focused ledger tests, then `npm test -- --runInBand`, `npm run lint`, `npm run build` in `server`, plus `npm run test:e2e` when available; record exact results/environment omission in `specs/001-admin-demo-readiness/quickstart.md`. Authorization or build failure blocks Phase 2.

## Phase 2 — Backend Moderation Invariants

- [x] T007 [P] [US3] Add an HTTP 403 admin-target exception in `server/src/modules/auth/domain/errors/auth.errors.ts` and enforce guest/host-only status mutation before persistence in `server/src/modules/auth/application/use-cases/update-account-status.usecase.ts`.
- [x] T008 [US3] Create `server/src/modules/auth/application/use-cases/update-account-status.usecase.spec.ts` for guest/host success, self/other-admin 403, not-found, and no repository write for admin targets.
- [x] T009 [US3] Create `server/src/modules/auth/presentation/controllers/admin-accounts.controller.spec.ts` for admin passage, no-token 401, and guest/host 403 on the status route without changing `admin-accounts.controller.ts` contract.
- [x] T010 [P] [US4] Update `server/src/modules/listings/application/use-cases/update-property-status-admin.usecase.ts` to require `checkHostKycVerified(property.hostId)` and verified `findVerifiedLicenseByPropertyId(property.id)` for every activation, including `requiresLocalLicense=false`; reuse `server/src/modules/listings/domain/errors/listings.errors.ts` and preserve paused/archived behavior.
- [x] T011 [US4] Extend `server/src/modules/listings/application/use-cases/listings.usecases.spec.ts` for both-prerequisites success, unverified KYC, missing/unverified license for both license-flag values, and no status write on failure.
- [x] T012 [US4] Create `server/src/modules/listings/presentation/controllers/admin-listings.controller.spec.ts` for admin/no-token/guest/host behavior on list, license, and status routes without contract changes.
- [x] T013 [P] [US5] Add blank-reason and non-pending-review errors in `server/src/modules/kyc/domain/errors/kyc.errors.ts`; enforce trimmed non-empty reject reason and pending-only review in `server/src/modules/kyc/application/use-cases/review-kyc.usecase.ts`; align `server/src/modules/kyc/presentation/requests/review-kyc.request.ts` without accepting reviewer identity.
- [x] T014 [US5] Extend `server/src/modules/kyc/application/use-cases/review-kyc.usecase.spec.ts` for approve/reject success, blank/whitespace failure, verified/rejected conflict, reviewer persistence, and no writes on failure.
- [x] T015 [US5] Create `server/src/modules/kyc/presentation/controllers/admin-kyc.controller.spec.ts` for admin/no-token/guest/host authorization on pending/review routes without contract changes.
- [x] T016 [CORE] **Gate 2**: run focused auth/listings/KYC tests, then `npm test -- --runInBand`, `npm run lint`, `npm run build` in `server`, plus e2e when available; log results in quickstart. Admin-target, activation, stale-review, authorization, or build failure blocks frontend work.

## Phase 3 — Authentication Shell and Navigation

- [x] T017 [US1] Normalize 401 clearing and 403 access-denied handling in `admin-ui/src/lib/api/api-client.ts`, `admin-ui/src/features/auth/store/use-auth-store.ts`, `admin-ui/src/features/auth/hooks/use-auth-queries.ts`, and `admin-ui/src/features/auth/hooks/use-auth-mutations.ts`.
- [x] T018 [US1] Implement login idle/loading/validation/authentication/unauthorized/success-redirect states without empty state in `admin-ui/src/app/login/page.tsx`, using `admin-ui/src/features/auth/services/auth-service.ts`, `admin-ui/src/features/auth/schemas/auth-schema.ts`, and `admin-ui/src/features/auth/types.ts`.
- [x] T019 [US1] Prevent protected-content flash, render explicit session/unauthorized states, and retain only Overview/Users/Properties/KYC navigation in `admin-ui/src/app/(dashboard)/layout.tsx`.
- [x] T020 [CORE] **Gate 3**: exercise six login states, expired token, guest/host denial, and content-flash prevention against real API; run `npm run lint` and `npm run build` in `admin-ui`; log results in quickstart.

## Phase 4 — Explicit Real-Data Overview

- [x] T021 [US2] Move `admin-ui/src/features/ledger/services/ledger-service.ts` to `/admin/ledger/platform-balance`, type balance/currency, remove fake-zero fallback, and expose data/loading/error/unauthorized/refetch from `admin-ui/src/features/ledger/hooks/use-ledger-queries.ts`.
- [x] T022 [P] [US2] Support real Overview counts through `admin-ui/src/features/users/services/users-service.ts`, `admin-ui/src/features/users/hooks/use-users-queries.ts`, `admin-ui/src/features/properties/services/properties-service.ts`, `admin-ui/src/features/properties/hooks/use-properties-queries.ts`, `admin-ui/src/features/kyc/services/kyc-service.ts`, and `admin-ui/src/features/kyc/hooks/use-kyc-queries.ts`; use list totals and pending-array length, not analytics or simulation.
- [x] T023 [US2] In `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`, render only platform balance, total users, total properties, pending KYC count, and shortcuts to `/users`, `/properties`, and `/kyc`; remove mock bookings, hard-coded/extra KPIs, Recent Bookings, and Meilisearch control.
- [x] T024 [US2] Implement loading, empty/unavailable, error+retry, unauthorized, and success for every Overview data region in `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`; never map empty/error to fake zero.
- [x] T025 [CORE] **Gate 4**: exercise five states for all four values, compare with real APIs, search Overview for mocks/hard-coded records/bookings/Meilisearch, then run admin-ui lint/build and log results in quickstart.

## Phase 5 — Users Vertical Slice

- [x] T026 [P] [US3] Synchronize filters/pagination and expose retry/error classification in `admin-ui/src/features/users/services/users-service.ts`, `admin-ui/src/features/users/types.ts`, `admin-ui/src/features/users/hooks/use-users-queries.ts`, `admin-ui/src/features/users/components/users-filter-bar.tsx`, and `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx`; reset page on each filter change.
- [x] T027 [P] [US3] Separate loading/empty/error+retry/unauthorized/success in `admin-ui/src/features/users/components/users-table.tsx` and wire state/refetch through `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx`.
- [x] T028 [US3] Remove status actions for all admin rows while retaining guest/host actions in `admin-ui/src/features/users/components/user-actions-menu.tsx`.
- [x] T029 [US3] Create `admin-ui/src/features/users/components/user-status-confirmation-dialog.tsx` using `admin-ui/src/components/ui/dialog.tsx`; wire confirmation through `admin-ui/src/features/users/components/users-table.tsx` and `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx`.
- [x] T030 [US3] Add pending lock, backend messages, success invalidation, and stale refetch without optimistic update in `admin-ui/src/features/users/hooks/use-users-mutations.ts`.
- [x] T031 [CORE] **Gate 5**: rerun focused server auth tests; validate five states, page reset, cancel/confirm, guest/host persistence, hidden admin actions, direct self/other-admin 403; run admin-ui lint/build and log results.

## Phase 6 — Properties and License Vertical Slice

- [x] T032 [P] [US4] Synchronize filters/pagination and error classification in `admin-ui/src/features/properties/services/properties-service.ts`, `admin-ui/src/features/properties/types.ts`, `admin-ui/src/features/properties/hooks/use-properties-queries.ts`, `admin-ui/src/features/properties/components/properties-filter-bar.tsx`, and `admin-ui/src/app/(dashboard)/properties/components/properties-management-container.tsx`.
- [x] T033 [P] [US4] Separate five list states in `admin-ui/src/features/properties/components/properties-table.tsx` and wire state/refetch through `admin-ui/src/app/(dashboard)/properties/components/properties-management-container.tsx`.
- [x] T034 [P] [US4] Complete license loading/no-license/error+retry/unauthorized/success/broken-URL states in `admin-ui/src/features/properties/components/property-license-drawer.tsx`; do not add license approval.
- [x] T035 [US4] Create `admin-ui/src/features/properties/components/property-status-confirmation-dialog.tsx` with `admin-ui/src/components/ui/dialog.tsx` and wire through `admin-ui/src/features/properties/components/property-actions-menu.tsx`, `admin-ui/src/features/properties/components/properties-table.tsx`, and `admin-ui/src/app/(dashboard)/properties/components/properties-management-container.tsx`.
- [x] T036 [US4] Add pending lock, backend prerequisite messages, success invalidation, and stale refetch without optimistic update in `admin-ui/src/features/properties/hooks/use-properties-mutations.ts`.
- [x] T037 [CORE] **Gate 6**: rerun focused listing tests; validate list/license states, page reset, confirmation, persistence, and blocked activation whenever either prerequisite is missing—including `requiresLocalLicense=false`; run lint/build in `server` and `admin-ui`, logging results.

## Phase 7 — KYC Vertical Slice

- [x] T038 [P] [US5] Expose retry/refetch/error classification from `admin-ui/src/features/kyc/hooks/use-kyc-queries.ts` and `admin-ui/src/features/kyc/services/kyc-service.ts`; separate five states in `admin-ui/src/features/kyc/components/kyc-documents-table.tsx`.
- [x] T039 [US5] Add approve confirmation with document/account identity and pending lock in `admin-ui/src/features/kyc/components/kyc-review-dialog.tsx` and `admin-ui/src/app/(dashboard)/kyc/components/kyc-queue-container.tsx`.
- [x] T040 [US5] Trim/validate rejection reason, preserve it through final confirmation, and lock pending actions in `admin-ui/src/features/kyc/components/kyc-rejection-dialog.tsx` and `admin-ui/src/app/(dashboard)/kyc/components/kyc-queue-container.tsx`.
- [x] T041 [US5] Add backend-message toast, queue invalidation, and stale/conflict refetch in `admin-ui/src/features/kyc/hooks/use-kyc-mutations.ts`; remove unrelated balance invalidation and do not modify `server/src/modules/kyc/infrastructure/providers/mock-kyc-provider.ts`.
- [x] T042 [CORE] **Gate 7**: rerun focused KYC tests; validate five states, approve/reject cancel+confirm, blank rejection, conflict, and persisted refresh; run lint/build in `server` and `admin-ui`, logging results.

## Phase 8 — Integrated Demo and Final Gate

- [x] T043 [CORE] Implement and run an authorized development-only idempotent demo seed using existing PrismaService, Prisma schema, bcrypt and dependencies because no administrator bootstrap API exists. Guard with non-production `NODE_ENV`, `ALLOW_DEMO_SEED=true`, and environment-only passwords; upsert two active admins, active guest, active host with verified KYC, one pending KYC document, one `requiresLocalLicense=false` property with verified license, and platform/revenue/VND zero balance. Add focused guard/idempotency/role/count validation; no UI fixtures, migration, reset, delete, or real credentials.
- [x] T044 [CORE] Verify implementation against `specs/001-admin-demo-readiness/contracts/admin-api.openapi.yaml`; run no-token/invalid/admin/guest/host authorization matrix for all admin routes and confirm the generic ledger contract remains unchanged.
- [x] T045 [CORE] Execute quickstart real-data flow: login → four Overview values/shortcuts → Users mutation → Properties/license/activation → KYC approve/reject; reload after successful mutations and record evidence.
- [ ] T046 [CORE] Run targeted guest/host regression checks and search `admin-ui/src` for mock/hard-coded Admin records; document environment-only omissions with cause/impact.
- [ ] T047 [CORE] **Gate 8**: run server test/lint/build and e2e when available, plus admin-ui lint/build; record exact results, final Constitution Check, and release decision in quickstart. Authorization, activation-prerequisite, mock-data, or build failures cannot be waived.

## Dependencies

```text
T001–T006 → T007–T016 → T017–T020 → T021–T025
                                      ↓
                    T026–T031 | T032–T037 | T038–T042
                                      ↓
                                  T043–T047
```

- Every phase gate must pass before the next phase begins.
- Phase 2 module tracks and Phase 5–7 UI slices may run in parallel only where `[P]` tasks do not overlap files.
- Completion requires T001–T047 checked and every gate recorded in `specs/001-admin-demo-readiness/quickstart.md`.
