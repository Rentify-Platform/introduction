# Implementation Plan: Rentify Admin Demo Readiness

**Branch**: `001-admin-demo-readiness` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-admin-demo-readiness/spec.md`

## Summary

Hoàn thiện vertical demo hiện có của Rentify Admin bằng cách gia cố phân quyền ở backend, bỏ dữ liệu mock trên dashboard, hoàn thiện state/confirmation/refresh của các feature Users, Properties và KYC, rồi xác nhận platform ledger balance từ API thật. Giữ nguyên monorepo, module và API contract hiện có; chỉ mở rộng contract khi cần biểu đạt đúng lỗi 401/403 hoặc bảo vệ platform balance.

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

## Constitution Check

### Pre-design gate

| Principle | Status | Evidence / Plan response |
|---|---|---|
| Preserve working behavior/contracts | PASS | Dùng endpoint và response wrapper hiện có; không sửa client guest/host; contract delta chỉ tăng bảo vệ cho dữ liệu platform admin. |
| Backend admin authorization | PASS | `@Authorize('admin')`/global guard cho mọi endpoint trong phạm vi; thêm test 401/403 và bảo vệ admin account status. |
| Existing/Clean Architecture | PASS | UI tiếp tục theo `features/*`; rule account/property đặt ở application use case/domain-facing ports, controller chỉ transport. |
| Real APIs/complete states | PASS | Xóa KPI/booking mock; dùng React Query services hiện có; lập state matrix cho loading/empty/error/unauthorized/success. |
| Focused demo delivery | PASS | Không bookings/ledger management/rescreen KYC/new role; không dependency/migration dự kiến. |
| Validate every phase | PASS | Mỗi phase có targeted test + lint/build gate; final integrated demo theo quickstart. |

### Post-design gate

PASS với một giả định cần xác nhận: activation property không bypass điều kiện host KYC và verified license khi property yêu cầu license. Nếu product quyết định cho phép override, spec phải được clarify/amend trước implementation; không tự mở rộng quyền trong code.

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

### Phase 1 — Backend authorization and invariant hardening

1. Bảo vệ endpoint đọc platform revenue balance dùng cho Admin UI bằng role `admin`; ưu tiên endpoint admin-specific hoặc decorator rõ ràng mà không làm mất quyền của ledger endpoint dùng cho guest/host. Không biến toàn bộ ledger API thành admin-only nếu contract khác đang dùng nó.
2. Thêm domain/application error dành cho mutation nhắm đến account role `admin`; `UpdateAccountStatusUseCase` kiểm tra target sau `findById`, trả 403 qua exception mapping và không gọi repository update.
3. Validate rejection reason ở backend khi action là `reject`: trim, yêu cầu không rỗng (và giữ giới hạn hợp lý theo DTO/domain); không dùng fallback reason ngầm cho admin rejection.
4. Với property activation, tái sử dụng repository checks `checkHostKycVerified` và `findVerifiedLicenseByPropertyId`, áp dụng rule publish hiện có trước update status. Pause/archive giữ contract admin hiện hữu.
5. Thêm/điều chỉnh unit và HTTP authorization tests cho admin success, missing token 401, guest/host 403, admin-target account mutation 403 và không persistence, KYC reject reason invalid, property activation prerequisite.

**Gate**: targeted Jest tests → `npm test -- --runInBand` → `npm run lint` → `npm run build` trong `server`.

### Phase 2 — Authentication shell and API error semantics

1. Giữ login service/store hiện có; chuẩn hóa xử lý 401 để xóa toàn bộ auth state liên quan và điều hướng login, 403 để hiển thị access denied mà không coi là token hết hạn.
2. Dashboard layout không render children trước khi session/role verification hoàn tất; non-admin nhận unauthorized state/redirect có thông báo thay vì `null` vô nghĩa.
3. Giới hạn navigation đúng phạm vi demo: Overview, Users, Properties, KYC. Loại hoặc ẩn Bookings/Ledger links chưa có screen trong scope; balance nằm trên Overview.
4. Bổ sung reusable error classification/state primitives chỉ khi chúng được dùng lặp lại.

**Gate**: targeted login/guard checks → `npm run lint` → `npm run build` trong `admin-ui`.

### Phase 3 — Real overview dashboard

1. Giữ query platform balance hiện có nhưng align type với response thực (`balanceCents`, `currency`, account metadata nếu có); không fallback lỗi/rỗng thành balance 0.
2. Xóa `mockRecentBookings` và các hard-coded KPIs. Chỉ hiển thị platform balance thật và navigation shortcuts; có thể dùng counts từ list APIs hiện có với `limit=1` nếu không thay contract và giá trị `total` đáng tin cậy.
3. Hoàn thiện loading, empty/unavailable, error + retry, unauthorized và success states cho từng vùng dữ liệu.
4. Loại nút Sync Meilisearch khỏi overview nếu không cần cho luồng demo trong spec.

**Gate**: kiểm thử có kiểm soát 5 trạng thái + `npm run lint` + `npm run build` trong `admin-ui`.

### Phase 4 — Users vertical slice

1. Giữ service/query keys/filter architecture hiện tại; xác nhận search, role, status, page, limit khớp backend và reset page khi filter đổi.
2. Tách error khỏi empty (hiện các table có nguy cơ gộp); thêm retry và unauthorized handling.
3. User action menu không cung cấp status actions khi `user.role === 'admin'`; có explanation/disabled state nếu cần để người demo hiểu.
4. Dùng Dialog hiện có cho confirmation gồm email/name, current status, target status; chỉ gọi mutation sau confirm.
5. Khi success: toast + invalidate `usersQueryKeys.all`; khi conflict/error: toast rõ, refresh nếu stale; disable trigger/dialog trong pending.
6. Kiểm thử target guest/host success và target self/other admin 403 qua backend, không chỉ UI.

**Gate**: server targeted tests nếu rule thay đổi → UI state/mutation checks → lint/build các package bị ảnh hưởng.

### Phase 5 — Properties and license vertical slice

1. Giữ list/search/filter/pagination services hiện có; sửa state separation và pagination validity.
2. License drawer xử lý riêng loading, no-license, fetch error + retry, unauthorized, success và broken/missing document URL.
3. Dùng confirmation dialog cho active/paused/archived, nêu title/current/target status và hậu quả dễ hiểu.
4. Khi activate bị backend từ chối do KYC/license, hiển thị message nghiệp vụ; không optimistic-update. Success invalidate toàn bộ property list/license keys liên quan.
5. Chỉ hiển thị View License khi có ý nghĩa nhưng vẫn cho phép empty state hợp lệ theo contract; không thêm chức năng approve license.

**Gate**: property use-case tests → state/mutation checks → server/admin-ui lint và build.

### Phase 6 — KYC vertical slice

1. Tách error khỏi empty queue; thêm retry, unauthorized và success count.
2. Approve mở confirmation rõ ràng trước mutation (hiện gọi trực tiếp); Reject yêu cầu reason trim hợp lệ và confirmation cuối trước mutation.
3. Backend kiểm tra document còn pending trước review để tránh review lặp/stale; trả conflict/business error rõ ràng nếu đã xử lý.
4. Sau success: toast + invalidate pending queue; sau stale failure: refetch queue; disable mọi review trigger trong pending.
5. Không thay MockKycProvider trong phạm vi này vì admin review dùng dữ liệu KYC đã persisted; tuyệt đối không tạo mock submissions trong UI. Việc thay provider KYC thuộc out of scope.

**Gate**: KYC use-case tests → UI 5-state/review checks → server/admin-ui lint và build.

### Phase 7 — Integrated demo validation

1. Chuẩn bị dữ liệu thật qua seed/database workflow hiện có: admin, guest, host, admin khác, properties có/không license, pending KYC, platform revenue ledger VND.
2. Chạy authorization matrix trực tiếp vào API cho no-token/guest/host/admin.
3. Chạy demo script từ login đến tất cả mutation, reload sau từng mutation để xác nhận persistence.
4. Chạy full applicable tests, lint, builds; smoke test guest/host contract bị ảnh hưởng.
5. Ghi lại command, kết quả, environment dependency và exception chưa giải quyết; lỗi nghiêm trọng/build failure chặn demo handoff.

## API Contract Strategy

- Giữ `ApiResponse.success(data, message)` và global error envelope hiện hữu.
- Không đổi path/body/response của accounts, properties/license, KYC endpoints.
- Platform balance phải có một route mà server enforce admin. Nếu endpoint `/ledger/accounts/balance` có consumer guest/host, thêm `/admin/ledger/platform-balance` dùng cùng `GetBalanceUseCase`; nếu xác nhận không có consumer khác, có thể decorate route hiện tại nhưng phải chứng minh không regression.
- 401 = thiếu/sai/hết hạn token; 403 = authenticated nhưng sai role hoặc target account là admin; 409/400 phù hợp cho stale/invalid domain transition.
- Contract tham chiếu: [admin-api.openapi.yaml](./contracts/admin-api.openapi.yaml).

## Complexity Tracking

Không có constitution violation dự kiến. Nếu cần dependency, migration, rewrite hoặc admin override property prerequisites, implementation phải dừng và cập nhật plan/spec trước.

