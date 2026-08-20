# Tasks: Rentify Admin Demo Readiness

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [admin-api.openapi.yaml](./contracts/admin-api.openapi.yaml)  
**Scope rule**: Không database migration, không dependency mới, không analytics, booking management, audit logs hoặc tính năng ngoài spec.  
**Priority rule**: Mọi task gắn `[P1]` là bắt buộc cho minimum demo. `[P]` nghĩa là có thể thực hiện song song sau khi dependencies ghi trong phase đã hoàn tất.

## Format

`- [ ] Txxx [P?] [P1] [USx] Description with exact target files`

- `[US1]`: Secure Admin Access
- `[US2]`: Dashboard and Platform Balance
- `[US3]`: User Management
- `[US4]`: Property and License Management
- `[US5]`: KYC Queue and Review
- `[CORE]`: Cross-cutting validation or infrastructure

## Phase 1: Backend Authorization Foundation

**Goal**: Mọi dữ liệu/hành động Admin trong demo được backend bảo vệ trước khi sửa UI.

- [ ] T001 [P1] [US2] Audit usages of the general balance endpoint and choose the compatibility-safe route described in the approved plan; record the chosen route and consumer evidence in `specs/001-admin-demo-readiness/research.md`, inspecting `server/src/modules/ledger/presentation/controllers/ledger.controller.ts`, `admin-ui/src/features/ledger/services/ledger-service.ts`, and all matches returned for `/ledger/accounts/balance`.
- [ ] T002 [P1] [US2] Implement an admin-authorized platform revenue VND balance read without restricting unrelated guest/host ledger behavior in `server/src/modules/ledger/presentation/controllers/ledger.controller.ts` or the new exact file `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.ts`, and register it in `server/src/modules/ledger/ledger.module.ts`; reuse `server/src/modules/ledger/application/use-cases/get-balance.usecase.ts` and `server/src/modules/ledger/presentation/mappers/ledger.mapper.ts`.
- [ ] T003 [P1] [US2] Immediately add focused authorization/selector tests for the protected platform balance route in the new exact file `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.spec.ts` (or `server/src/modules/ledger/presentation/controllers/ledger.controller.spec.ts` if T002 safely retains the route there), covering admin success, no-token 401, guest 403, host 403, and fixed `platform/revenue/VND` selection.
- [ ] T004 [P1] [CORE] Run the focused ledger tests from T003 and record command/result under a Phase 1 validation log in `specs/001-admin-demo-readiness/quickstart.md`; do not continue past a failing authorization case.

## Phase 2: Backend Account Mutation Invariant

**Goal**: Không admin nào có thể thay đổi status của chính mình hoặc admin khác.

- [ ] T005 [P1] [US3] Add a clear `BusinessException` with HTTP 403 for protected admin targets in `server/src/modules/auth/domain/errors/auth.errors.ts`, then enforce the target-role check before repository mutation in `server/src/modules/auth/application/use-cases/update-account-status.usecase.ts`.
- [ ] T006 [P1] [US3] Immediately add focused use-case tests in the new exact file `server/src/modules/auth/application/use-cases/update-account-status.usecase.spec.ts` for guest success, host success, own-admin target 403, other-admin target 403, account-not-found, and assertions that `updateStatus` is never called for an admin target.
- [ ] T007 [P1] [US3] Add controller/guard authorization coverage for `PATCH /admin/accounts/:accountId/status` in the new exact file `server/src/modules/auth/presentation/controllers/admin-accounts.controller.spec.ts`, covering no-token 401, guest/host 403 and authenticated-admin passage to the use case without changing the existing request/response contract in `server/src/modules/auth/presentation/controllers/admin-accounts.controller.ts`.
- [ ] T008 [P1] [CORE] Run the focused auth tests from T006–T007 and append command/result to `specs/001-admin-demo-readiness/quickstart.md`; resolve all failures before proceeding.

## Phase 3: Backend Property and KYC Invariants

**Goal**: Moderation mutations preserve existing domain safety and reject invalid/stale KYC reviews.

- [ ] T009 [P] [P1] [US4] Enforce the approved activation prerequisites in `server/src/modules/listings/application/use-cases/update-property-status-admin.usecase.ts` using `checkHostKycVerified` and `findVerifiedLicenseByPropertyId` from `server/src/modules/listings/domain/repositories/listings.repository.ts`, and reuse errors from `server/src/modules/listings/domain/errors/listings.errors.ts`; keep paused/archived contract unchanged.
- [ ] T010 [P1] [US4] Immediately add focused activation tests to `server/src/modules/listings/application/use-cases/listings.usecases.spec.ts` for verified host/no-required-license success, unverified host failure, required-license missing/unverified failure, verified-license success, and no repository status update on failure.
- [ ] T011 [P] [P1] [US5] Add explicit blank rejection-reason and already-reviewed document errors in `server/src/modules/kyc/domain/errors/kyc.errors.ts`; enforce trimmed non-empty reason for reject and pending-only review in `server/src/modules/kyc/application/use-cases/review-kyc.usecase.ts`; align DTO validation in `server/src/modules/kyc/presentation/requests/review-kyc.request.ts` without accepting reviewer identity from the body.
- [ ] T012 [P1] [US5] Immediately extend `server/src/modules/kyc/application/use-cases/review-kyc.usecase.spec.ts` with approve-pending success, reject-with-reason success, blank/whitespace reason failure, already-verified/rejected conflict, reviewer persistence, and no writes on failure.
- [ ] T013 [P1] [US4] Add admin/no-token/guest/host authorization coverage for property list, license and status routes in the new exact file `server/src/modules/listings/presentation/controllers/admin-listings.controller.spec.ts`, without altering contracts in `server/src/modules/listings/presentation/controllers/admin-listings.controller.ts`.
- [ ] T014 [P] [P1] [US5] Add admin/no-token/guest/host authorization coverage for pending/review KYC routes in the new exact file `server/src/modules/kyc/presentation/controllers/admin-kyc.controller.spec.ts`, without altering contracts in `server/src/modules/kyc/presentation/controllers/admin-kyc.controller.ts`.
- [ ] T015 [P1] [CORE] Run focused listing and KYC tests from T010, T012–T014, then run `npm test -- --runInBand`, `npm run lint`, and `npm run build` in `server`; append results to `specs/001-admin-demo-readiness/quickstart.md` and fix failures before frontend work.

## Phase 4: Admin Authentication Shell

**Goal**: Chỉ render Admin content sau khi xác thực role hoàn tất và phân biệt đúng 401/403.

- [ ] T016 [P1] [US1] Normalize session clearing and current-user refresh behavior in `admin-ui/src/features/auth/store/use-auth-store.ts`, `admin-ui/src/features/auth/hooks/use-auth-queries.ts`, `admin-ui/src/features/auth/hooks/use-auth-mutations.ts`, and `admin-ui/src/lib/api/api-client.ts`, ensuring 401 clears token/user state while 403 preserves authentication for an access-denied state.
- [ ] T017 [P1] [US1] Complete login loading/error/admin-role handling without changing the existing API in `admin-ui/src/app/login/page.tsx`, `admin-ui/src/features/auth/services/auth-service.ts`, and `admin-ui/src/features/auth/types.ts`; guest/host login must not enter the dashboard.
- [ ] T018 [P1] [US1] Prevent protected-content flash and render explicit verifying/unauthenticated/unauthorized states in `admin-ui/src/app/(dashboard)/layout.tsx`; remove out-of-scope Bookings and Ledger navigation items while keeping Overview, Users, Properties and KYC.
- [ ] T019 [P1] [CORE] Validate login as admin, guest and host plus expired-token handling against the real API, then run `npm run lint` and `npm run build` in `admin-ui`; record results in `specs/001-admin-demo-readiness/quickstart.md`.

## Phase 5: Real Overview Dashboard

**Goal**: Dashboard demo dùng dữ liệu thật, không có KPI/booking mock.

- [ ] T020 [P1] [US2] Align the platform balance client route and response type with T002 in `admin-ui/src/features/ledger/services/ledger-service.ts` and `admin-ui/src/features/ledger/hooks/use-ledger-queries.ts`; remove the fabricated `{ balanceCents: 0 }` error/empty fallback and preserve currency.
- [ ] T021 [P1] [US2] Remove `mockRecentBookings`, hard-coded KPIs and out-of-scope Meilisearch control from `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`; render only real platform balance and working shortcuts to `/users`, `/properties`, and `/kyc`.
- [ ] T022 [P1] [US2] Implement distinct loading, missing-balance/empty, error with retry, unauthorized, and success rendering in `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`, using the query state exposed by `admin-ui/src/features/ledger/hooks/use-ledger-queries.ts`.
- [ ] T023 [P1] [CORE] Exercise all five Overview states and verify no `mock`, hard-coded business records, or recent-booking fixture remains in `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`; run `npm run lint` and `npm run build` in `admin-ui` and log results in `specs/001-admin-demo-readiness/quickstart.md`.

## Phase 6: Users Minimum Demo Slice

**Goal**: Search/filter và account status mutation hoạt động end-to-end với confirmation và admin-target protection.

- [ ] T024 [P] [P1] [US3] Keep query/filter pagination synchronized and expose retry/refetch/error classification in `admin-ui/src/features/users/hooks/use-users-queries.ts`, `admin-ui/src/features/users/services/users-service.ts`, `admin-ui/src/features/users/types.ts`, and `admin-ui/src/features/users/components/users-filter-bar.tsx`; every search/role/status change must reset page to 1.
- [ ] T025 [P] [P1] [US3] Separate loading, empty, error with retry, unauthorized and success table states in `admin-ui/src/features/users/components/users-table.tsx` and wire callbacks/query state through `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx`.
- [ ] T026 [P1] [US3] Hide or disable all status actions for `user.role === 'admin'` in `admin-ui/src/features/users/components/user-actions-menu.tsx`, while retaining guest/host actions.
- [ ] T027 [P1] [US3] Add the new exact confirmation component `admin-ui/src/features/users/components/user-status-confirmation-dialog.tsx` using existing `admin-ui/src/components/ui/dialog.tsx`, and route status selection through confirmation in `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx` and `admin-ui/src/features/users/components/users-table.tsx`.
- [ ] T028 [P1] [US3] Ensure pending lock, success/error toast, success invalidation, and stale-error refetch in `admin-ui/src/features/users/hooks/use-users-mutations.ts`; surface the backend 403 message for protected admin targets instead of a generic success assumption.
- [ ] T029 [P1] [CORE] Validate Users loading/empty/error/unauthorized/success, search/filter page reset, cancel/confirm behavior, guest/host persisted update, hidden admin action, and direct own/other-admin API 403; then run `npm run lint` and `npm run build` in `admin-ui` and log results in `specs/001-admin-demo-readiness/quickstart.md`.

## Phase 7: Properties and License Minimum Demo Slice

**Goal**: Search/filter, license read và property status mutation hoạt động với domain-safe confirmation.

- [ ] T030 [P] [P1] [US4] Keep query/filter pagination synchronized and expose retry/refetch/error classification in `admin-ui/src/features/properties/hooks/use-properties-queries.ts`, `admin-ui/src/features/properties/services/properties-service.ts`, `admin-ui/src/features/properties/types.ts`, and `admin-ui/src/features/properties/components/properties-filter-bar.tsx`; every search/status/host change must reset page to 1.
- [ ] T031 [P] [P1] [US4] Separate loading, empty, error with retry, unauthorized and success table states in `admin-ui/src/features/properties/components/properties-table.tsx` and wire query state through `admin-ui/src/app/(dashboard)/properties/components/properties-management-container.tsx`.
- [ ] T032 [P] [P1] [US4] Complete license loading, no-license empty, fetch error with retry, unauthorized, success, and broken/missing-document handling in `admin-ui/src/features/properties/components/property-license-drawer.tsx` using `admin-ui/src/features/properties/hooks/use-properties-queries.ts`; do not add license approval.
- [ ] T033 [P1] [US4] Add the new exact confirmation component `admin-ui/src/features/properties/components/property-status-confirmation-dialog.tsx` using existing `admin-ui/src/components/ui/dialog.tsx`, and route actions through it from `admin-ui/src/features/properties/components/property-actions-menu.tsx`, `admin-ui/src/features/properties/components/properties-table.tsx`, and `admin-ui/src/app/(dashboard)/properties/components/properties-management-container.tsx`.
- [ ] T034 [P1] [US4] Ensure pending lock, success/error toast, success invalidation and stale-error refetch in `admin-ui/src/features/properties/hooks/use-properties-mutations.ts`; show backend KYC/license prerequisite messages and do not optimistic-update.
- [ ] T035 [P1] [CORE] Validate Properties loading/empty/error/unauthorized/success, filter page reset, license success/empty/error, cancel/confirm behavior, persisted status refresh, and blocked activation prerequisites; then run relevant server property tests plus `npm run lint` and `npm run build` in `admin-ui`, logging results in `specs/001-admin-demo-readiness/quickstart.md`.

## Phase 8: KYC Minimum Demo Slice

**Goal**: Pending queue review hoạt động với confirmation, rejection reason và stale-data recovery.

- [ ] T036 [P] [P1] [US5] Expose retry/refetch and error classification from `admin-ui/src/features/kyc/hooks/use-kyc-queries.ts` and `admin-ui/src/features/kyc/services/kyc-service.ts`, then separate loading, empty, error with retry, unauthorized and success states in `admin-ui/src/features/kyc/components/kyc-documents-table.tsx`.
- [ ] T037 [P1] [US5] Change approve from direct mutation to explicit confirmation in `admin-ui/src/features/kyc/components/kyc-review-dialog.tsx` and `admin-ui/src/app/(dashboard)/kyc/components/kyc-queue-container.tsx`; show document/account identity and disable actions while pending.
- [ ] T038 [P1] [US5] Trim and validate non-empty rejection reason, add the final confirmation step, and preserve the typed reason in `admin-ui/src/features/kyc/components/kyc-rejection-dialog.tsx` and `admin-ui/src/app/(dashboard)/kyc/components/kyc-queue-container.tsx`.
- [ ] T039 [P1] [US5] Ensure success/error toast, pending queue invalidation and stale/conflict refetch in `admin-ui/src/features/kyc/hooks/use-kyc-mutations.ts`; remove the unrelated/incorrect platform-balance invalidation and surface backend business messages.
- [ ] T040 [P1] [CORE] Validate KYC loading/empty/error/unauthorized/success, approve cancel/confirm, blank reject prevention, reject cancel/confirm with persisted reason, duplicate-review conflict and queue refresh; then run relevant server KYC tests plus `npm run lint` and `npm run build` in `admin-ui`, logging results in `specs/001-admin-demo-readiness/quickstart.md`.

## Phase 9: Final Integration and Demo Gate

**Goal**: Chứng minh minimum demo hoạt động, builds thành công và không regression nghiêm trọng.

- [ ] T041 [P1] [CORE] Verify the implemented endpoints still match `specs/001-admin-demo-readiness/contracts/admin-api.openapi.yaml`; update only the documentation if the compatibility-safe route chosen in T001 differs, and do not broaden scope.
- [ ] T042 [P1] [CORE] Run the complete server validation in `server`: `npm test -- --runInBand`, `npm run lint`, `npm run build`, and `npm run test:e2e` when the documented environment is available; record exact commands, results and any environment-only omission in `specs/001-admin-demo-readiness/quickstart.md`.
- [ ] T043 [P1] [CORE] Run final frontend validation in `admin-ui`: `npm run lint` and `npm run build`; resolve all feature-caused errors and record exact results in `specs/001-admin-demo-readiness/quickstart.md`.
- [ ] T044 [P1] [CORE] Execute the documented authorization matrix and main demo smoke test in `specs/001-admin-demo-readiness/quickstart.md` against real APIs/data: admin login → Overview balance → Users search/filter/status → Properties search/filter/license/status → KYC approve/reject; reload after each mutation and record pass/fail evidence in that file.
- [ ] T045 [P1] [CORE] Run targeted guest/host regression smoke checks for shared auth/listing contracts and verify no Admin production mock records remain by inspecting `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx` and searching `admin-ui/src` for demo fixtures; document the final release decision in `specs/001-admin-demo-readiness/quickstart.md`.

## Dependencies and Execution Order

```text
T001 → T002 → T003 → T004
                  ↓
T005 → T006 → T007 → T008
                  ↓
       ┌──────────┴──────────┐
       T009 → T010 → T013    T011 → T012 → T014
       └──────────┬──────────┘
                  T015
                   ↓
          T016 → T017 → T018 → T019
                   ↓
          T020 → T021 → T022 → T023
                   ↓
       ┌───────────┼───────────┐
       T024–T029   T030–T035   T036–T040
       └───────────┼───────────┘
                   ↓
          T041 → T042 → T043 → T044 → T045
```

- Backend phases 1–3 MUST finish before frontend mutation work.
- After T023, the Users, Properties and KYC slices can be assigned independently; within each slice, preserve its listed order except tasks marked `[P]` that touch distinct files.
- T041–T045 are sequential final gates. A failed authorization test or build blocks the demo handoff.

## Minimum Demo Definition

All tasks are `[P1]`. The minimum demo is complete only when T001–T045 are checked and Phase 9 passes. There are intentionally no P2/P3 tasks because optional polish and new features are outside the approved scope.

