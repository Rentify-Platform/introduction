# Implementation Plan: Rentify Admin Demo Readiness

**Branch**: `001-admin-demo-readiness` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-admin-demo-readiness/spec.md`

## Summary

Hoàn thiện vertical demo hiện có của Rentify Admin bằng cách gia cố phân quyền ở backend, thêm boundary ledger admin-only nhỏ nhất, thay Overview bằng đúng platform balance, total users, total properties và pending KYC count từ API thật, rồi hoàn thiện state/confirmation/refresh của Users, Properties và KYC. Property activation luôn giữ cả verified host KYC và verified property license; không migration, dependency, rewrite hay tính năng ngoài phạm vi.

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js runtime tương thích Next.js 16 và NestJS 11  
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS 4, Zustand 5, TanStack React Query 5, Axios 1; NestJS 11, Prisma 7, PostgreSQL  
**Storage**: PostgreSQL qua Prisma; không dự kiến migration  
**Testing**: Jest/ts-jest và Nest testing ở `server`; lint/build và targeted UI verification ở `admin-ui`  
**Target Platform**: Web browser + Node.js API server  
**Project Type**: Brownfield monorepo gồm `admin-ui`, `client`, `server`  
**Performance Goals**: Các thao tác search/filter/mutation phản hồi trạng thái ngay; không tạo request mutation trùng từ một trigger; pagination giữ giới hạn hiện có 20 bản ghi mặc định  
**Constraints**: Không mock production data, không dependency mới, không rewrite, giữ contract guest/host, mọi admin API enforce role ở server  
**Scale/Scope**: 4 màn hình Admin chính (Overview, Users, Properties, KYC), 1 login flow, 4 nhóm API bảo vệ

**Rebase baseline**: Kế hoạch được reinspect trên `HEAD ba924ea`, ngay trên `origin/main fcf558d`. Các target dưới đây khớp tree hiện tại; file ghi là “tạo” chưa tồn tại, các file còn lại đã được kiểm tra tồn tại sau rebase.

## Constitution Check

### Pre-design gate

| Principle                           | Status | Evidence / Plan response                                                                                                           |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Preserve working behavior/contracts | PASS   | Dùng endpoint và response wrapper hiện có; không sửa client guest/host; contract delta chỉ tăng bảo vệ cho dữ liệu platform admin. |
| Backend admin authorization         | PASS   | `@Authorize('admin')`/global guard cho mọi endpoint trong phạm vi; thêm test 401/403 và bảo vệ admin account status.               |
| Existing/Clean Architecture         | PASS   | UI tiếp tục theo `features/*`; rule account/property đặt ở application use case/domain-facing ports, controller chỉ transport.     |
| Real APIs/complete states           | PASS   | Xóa KPI/booking mock; dùng React Query services hiện có; lập state matrix cho loading/empty/error/unauthorized/success.            |
| Focused demo delivery               | PASS   | Không bookings/ledger management/rescreen KYC/new role; không dependency/migration dự kiến.                                        |
| Validate every phase                | PASS   | Mỗi phase có targeted test + lint/build gate; final integrated demo theo quickstart.                                               |

### Post-design gate

PASS sau clarification: activation property luôn yêu cầu host KYC verified và property license verified; admin không bypass và `requiresLocalLicense` không làm điều kiện license trở thành tùy chọn.

## Project Structure

### Documentation for this feature

```text
specs/001-admin-demo-readiness/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-api.openapi.yaml
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source code in scope

```text
admin-ui/src/
├── app/
│   ├── login/
│   └── (dashboard)/
│       ├── components/
│       ├── users/
│       ├── properties/
│       └── kyc/
├── components/ui/
├── components/shared/
├── features/
│   ├── auth/
│   ├── users/
│   ├── properties/
│   ├── kyc/
│   └── ledger/
└── lib/api/

server/src/
├── shared/
│   ├── decorators/
│   ├── guards/
│   └── filters/
└── modules/
    ├── auth/{application,domain,infrastructure,presentation}/
    ├── listings/{application,domain,infrastructure,presentation}/
    ├── kyc/{application,domain,infrastructure,presentation}/
    └── ledger/{application,domain,infrastructure,presentation}/
```

**Structure Decision**: Giữ nguyên ba package. Không tạo shared package mới. Component dùng lại confirmation/error-state chỉ được đặt trong `admin-ui/src/components/shared` nếu có ít nhất hai feature sử dụng; nếu không thì colocate trong feature.

## Implementation Phases

### Phase 1 — Small admin-only ledger boundary

**Current evidence**: Sau rebase, chỉ `admin-ui/src/features/ledger/services/ledger-service.ts` gọi `/ledger/accounts/balance`. Route tổng quát trong `server/src/modules/ledger/presentation/controllers/ledger.controller.ts` nhận selector tùy ý và chỉ dùng `JwtAuthGuard`; thay đổi authorization của route này có rủi ro contract dùng chung.

1. Tạo `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.ts` với `@Controller('admin/ledger')`, `@UseGuards(JwtAuthGuard)`, `@Authorize('admin')` và `GET platform-balance`. Controller không nhận owner/query selector từ client; luôn tạo `GetBalanceCommand(null, 'platform', null, 'revenue', 'VND')`, reuse `GetBalanceUseCase`, `LedgerMapper` và `ApiResponse` hiện có.
2. Đăng ký controller mới trong `server/src/modules/ledger/ledger.module.ts`. Không sửa behavior của `server/src/modules/ledger/presentation/controllers/ledger.controller.ts`, `GetBalanceUseCase`, repository hay schema.
3. Tạo `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.spec.ts` để kiểm tra fixed selector, admin success, no-token 401, guest 403 và host 403. Giữ `server/src/modules/ledger/application/use-cases/get-balance.usecase.spec.ts` làm regression cho use case dùng chung.
4. Đồng bộ route/response được chốt trong `specs/001-admin-demo-readiness/contracts/admin-api.openapi.yaml` và ghi consumer evidence vào `specs/001-admin-demo-readiness/research.md`.

**Gate 1**: chạy targeted ledger controller/use-case tests, sau đó trong `server` chạy `npm test -- --runInBand`, `npm run lint`, `npm run build`; khi môi trường HTTP sẵn có chạy `npm run test:e2e`. Ghi command/kết quả vào `specs/001-admin-demo-readiness/quickstart.md`; bất kỳ failure authorization nào chặn Phase 2.

### Phase 2 — Backend moderation invariants

1. Trong `server/src/modules/auth/domain/errors/auth.errors.ts`, thêm business exception HTTP 403 cho target role admin. Trong `server/src/modules/auth/application/use-cases/update-account-status.usecase.ts`, kiểm tra account sau `findById`; chỉ `guest`/`host` được gọi `updateStatus`, mọi admin target—including caller hiện tại và admin khác—bị từ chối trước persistence.
2. Tạo `server/src/modules/auth/application/use-cases/update-account-status.usecase.spec.ts` cho guest/host success, self-admin 403, other-admin 403, not-found và `updateStatus` không được gọi khi target là admin. Tạo `server/src/modules/auth/presentation/controllers/admin-accounts.controller.spec.ts` cho no-token/admin/guest/host route behavior mà không đổi `server/src/modules/auth/presentation/controllers/admin-accounts.controller.ts` contract.
3. Trong `server/src/modules/listings/application/use-cases/update-property-status-admin.usecase.ts`, khi target là `active`, luôn gọi `checkHostKycVerified(property.hostId)` và `findVerifiedLicenseByPropertyId(property.id)`. Reuse `HostNotVerifiedException` và `PropertyLicenseRequiredException` từ `server/src/modules/listings/domain/errors/listings.errors.ts`; license `verified` và host KYC verified đều bắt buộc kể cả `property.requiresLocalLicense === false`. Không có admin bypass; `paused`/`archived` giữ behavior hiện tại.
4. Mở rộng `server/src/modules/listings/application/use-cases/listings.usecases.spec.ts` với success khi cả hai prerequisite verified, failure cho unverified host, missing/unverified license ở cả hai giá trị `requiresLocalLicense`, và assertion không gọi `updatePropertyStatus` khi failure. Tạo `server/src/modules/listings/presentation/controllers/admin-listings.controller.spec.ts` cho admin/no-token/guest/host trên list/license/status.
5. Trong `server/src/modules/kyc/domain/errors/kyc.errors.ts`, thêm lỗi reason blank và document không còn pending. Enforce trim/non-empty reject reason và pending-only review trong `server/src/modules/kyc/application/use-cases/review-kyc.usecase.ts`; align transport validation trong `server/src/modules/kyc/presentation/requests/review-kyc.request.ts`, không nhận reviewer từ body.
6. Mở rộng `server/src/modules/kyc/application/use-cases/review-kyc.usecase.spec.ts`; tạo `server/src/modules/kyc/presentation/controllers/admin-kyc.controller.spec.ts` cho approve/reject success, blank reason, stale review, reviewer persistence, no-write failures và admin/no-token/guest/host authorization.

**Gate 2**: chạy targeted auth/listings/KYC tests, sau đó `npm test -- --runInBand`, `npm run lint`, `npm run build` trong `server`; chạy `npm run test:e2e` khi hạ tầng sẵn có. Ghi kết quả vào quickstart; KYC/license prerequisite hoặc admin-target test failure chặn frontend phases.

### Phase 3 — Authentication shell and navigation

1. Chuẩn hóa 401/403 trong `admin-ui/src/lib/api/api-client.ts`, `admin-ui/src/features/auth/store/use-auth-store.ts`, `admin-ui/src/features/auth/hooks/use-auth-queries.ts` và `admin-ui/src/features/auth/hooks/use-auth-mutations.ts`: 401 xóa token/user và quay về login; 403 giữ session để render access denied.
2. Trong `admin-ui/src/app/login/page.tsx`, biểu diễn riêng idle, loading, validation error, authentication error, unauthorized và success redirect; login không có empty state và guest/host không được vào dashboard.
3. Trong `admin-ui/src/app/(dashboard)/layout.tsx`, không render protected children trước session/role resolution, thay `return null` bằng unauthorized state, và giới hạn `NAV_ITEMS` ở Overview, Users, Properties, KYC. Xóa Bookings/Ledger navigation nhưng không xóa module ngoài scope.

**Gate 3**: manual/targeted checks cho sáu login states, expired token, guest/host denial và protected-content flash; chạy `npm run lint`, `npm run build` trong `admin-ui`, ghi kết quả vào quickstart.

### Phase 4 — Explicit real-data Overview

1. Trong `admin-ui/src/features/ledger/services/ledger-service.ts`, chuyển sang `/admin/ledger/platform-balance`, khai báo response gồm `balanceCents` và `currency`, bỏ fallback `{ balanceCents: 0 }`. Trong `admin-ui/src/features/ledger/hooks/use-ledger-queries.ts`, expose data, loading, error, unauthorized và `refetch`.
2. Reuse `admin-ui/src/features/users/services/users-service.ts` + `admin-ui/src/features/users/hooks/use-users-queries.ts` với `{ page: 1, limit: 1 }` để lấy `total users`; reuse properties equivalents để lấy `total properties`; reuse `admin-ui/src/features/kyc/services/kyc-service.ts` + `admin-ui/src/features/kyc/hooks/use-kyc-queries.ts` để lấy `pendingDocs.length`. Không tạo analytics endpoint hoặc simulated count.
3. Trong `admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx`, chỉ render: real platform balance, total users, total properties, pending KYC count, và shortcuts `/users`, `/properties`, `/kyc`. Xóa `mockRecentBookings`, hard-coded values/descriptions, Recent Bookings table, Sync Meilisearch control và mọi KPI khác.
4. Overview phải phân biệt loading, empty/unavailable, error + retry, unauthorized và success cho các query thật; lỗi/rỗng không được hiển thị thành zero giả.

**Gate 4**: kiểm tra năm data states cho từng region, đối chiếu bốn values với API thật, tìm `mockRecentBookings`/hard-coded business records/Recent Bookings trong Overview, rồi chạy `npm run lint`, `npm run build` trong `admin-ui`. Ghi kết quả vào quickstart.

### Phase 5 — Users vertical slice

1. Giữ contract trong `admin-ui/src/features/users/services/users-service.ts` và types trong `admin-ui/src/features/users/types.ts`; expose retry/error classification trong `admin-ui/src/features/users/hooks/use-users-queries.ts`, reset page từ `admin-ui/src/features/users/components/users-filter-bar.tsx` và `admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx`.
2. Tách loading, empty, error + retry, unauthorized và success trong `admin-ui/src/features/users/components/users-table.tsx`. Trong `admin-ui/src/features/users/components/user-actions-menu.tsx`, không cung cấp status mutation cho bất kỳ `role === 'admin'` row nào.
3. Tạo `admin-ui/src/features/users/components/user-status-confirmation-dialog.tsx` bằng Dialog hiện có; wire qua users table/container. Cập nhật `admin-ui/src/features/users/hooks/use-users-mutations.ts` cho pending lock, backend error message, success invalidation và stale refetch; không optimistic update.

**Gate 5**: kiểm tra năm data states, filter/page reset, cancel/confirm, guest/host persisted success, hidden admin actions và direct self/other-admin 403; rerun targeted server auth tests, rồi `npm run lint`, `npm run build` trong `admin-ui`. Ghi kết quả vào quickstart.

### Phase 6 — Properties and license vertical slice

1. Giữ contract trong `admin-ui/src/features/properties/services/properties-service.ts` và `types.ts`; expose retry/error classification trong `hooks/use-properties-queries.ts`, reset pagination qua `components/properties-filter-bar.tsx` và `app/(dashboard)/properties/components/properties-management-container.tsx`.
2. Tách five-state table rendering trong `admin-ui/src/features/properties/components/properties-table.tsx`; hoàn thiện license loading, no-license empty, error + retry, unauthorized, success và broken/missing URL trong `admin-ui/src/features/properties/components/property-license-drawer.tsx`. Không thêm license approval.
3. Tạo `admin-ui/src/features/properties/components/property-status-confirmation-dialog.tsx`; wire từ `property-actions-menu.tsx`, `properties-table.tsx` và management container. Cập nhật `hooks/use-properties-mutations.ts` cho pending lock, backend KYC/license messages, success invalidation và stale refetch; không optimistic update.

**Gate 6**: rerun targeted listing prerequisite/controller tests; kiểm tra five-state list, license sub-states, filter/page reset, cancel/confirm, persisted refresh và activation bị chặn khi thiếu bất kỳ prerequisite nào; chạy server `npm run lint`/`npm run build` và admin-ui `npm run lint`/`npm run build`. Ghi kết quả vào quickstart.

### Phase 7 — KYC vertical slice

1. Expose retry/error classification trong `admin-ui/src/features/kyc/hooks/use-kyc-queries.ts` và giữ API thật trong `services/kyc-service.ts`; tách loading, empty, error + retry, unauthorized và success trong `components/kyc-documents-table.tsx`.
2. Thêm approve confirmation trong `admin-ui/src/features/kyc/components/kyc-review-dialog.tsx`; trim/validate reject reason và thêm final confirmation trong `kyc-rejection-dialog.tsx`; coordinate state trong `admin-ui/src/app/(dashboard)/kyc/components/kyc-queue-container.tsx`.
3. Cập nhật `admin-ui/src/features/kyc/hooks/use-kyc-mutations.ts` cho pending lock, backend message, queue invalidation và stale/conflict refetch; không thay `server/src/modules/kyc/infrastructure/providers/mock-kyc-provider.ts` vì provider integration/rescreen nằm ngoài admin review scope và không tạo mock submission trong UI.

**Gate 7**: rerun targeted KYC tests; kiểm tra five-state queue, approve cancel/confirm, reject blank/cancel/confirm, duplicate-review conflict và persisted queue refresh; chạy server `npm run lint`/`npm run build` và admin-ui `npm run lint`/`npm run build`. Ghi kết quả vào quickstart.

### Phase 8 — Integrated demo and final constitution gate

1. Do development database có thể trống và không có admin bootstrap API, thêm seed command development-only, idempotent bằng PrismaService + bcrypt hiện có. Command từ chối `NODE_ENV=production`, yêu cầu `ALLOW_DEMO_SEED=true`, đọc bốn password từ environment variables, không log secret, không migration/reset/delete, và upsert dataset tối thiểu: hai active admin, active guest, active host với verified KYC, một pending KYC document, một `requiresLocalLicense=false` property có verified license, cùng platform/revenue/VND ledger account + zero balance. Thêm focused test cho guard, idempotency, roles và counts.
2. Chạy authorization matrix no-token/invalid/admin/guest/host cho account, property/license, KYC và admin platform-balance routes; xác nhận generic ledger route không bị thay contract.
3. Chạy login → Overview four real values → Users mutation → Properties/license/activation → KYC approve/reject; reload sau mutation để xác nhận persistence và chạy targeted guest/host regression smoke.
4. Trong `server`: `npm test -- --runInBand`, `npm run lint`, `npm run build`, và `npm run test:e2e` khi environment sẵn có. Trong `admin-ui`: `npm run lint`, `npm run build`. Ghi toàn bộ command/result/exception vào quickstart.
5. Re-run Constitution Check: không client-only authorization, mock data, missing states, contract break, migration, dependency, unrelated refactor hoặc feature expansion. Failure nghiêm trọng hoặc build failure chặn handoff.

**Gate 8**: chỉ handoff khi authorization matrix, integrated real-data demo, guest/host regression checks, full applicable server validation, admin-ui lint/build và final Constitution Check đều pass hoặc có environment-only omission được ghi rõ; không chấp nhận exception cho authorization, activation prerequisites hoặc build failure.

## API Contract Strategy

- Giữ `ApiResponse.success(data, message)` và global error envelope hiện hữu.
- Không đổi path/body/response của accounts, properties/license, KYC endpoints.
- Platform balance dùng route mới `GET /admin/ledger/platform-balance`, enforce `JwtAuthGuard` + `@Authorize('admin')` và fixed selector `platform/revenue/VND`. Giữ nguyên `/ledger/accounts/balance`; Admin UI là consumer duy nhất được tìm thấy và được chuyển sang route mới.
- 401 = thiếu/sai/hết hạn token; 403 = authenticated nhưng sai role hoặc target account là admin; 409/400 phù hợp cho stale/invalid domain transition.
- Contract tham chiếu: [admin-api.openapi.yaml](./contracts/admin-api.openapi.yaml).

## Complexity Tracking

Không có constitution violation dự kiến. Kế hoạch không thêm migration, dependency hay module tính năng ngoài phạm vi. Nếu implementation phát hiện cần một trong các thay đổi đó, hoặc cần giảm KYC/license activation prerequisites, phải dừng và cập nhật spec/plan trước.
