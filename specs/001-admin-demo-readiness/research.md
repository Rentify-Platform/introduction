# Research: Rentify Admin Demo Readiness

## Decision 1: Extend existing vertical slices

**Decision**: Hoàn thiện `features/auth`, `users`, `properties`, `kyc`, `ledger` và các controller/use case tương ứng.  
**Rationale**: Các route, services, hooks, tables, dialogs và repositories đã tồn tại; sửa tại chỗ giảm regression và tuân thủ brownfield constitution.  
**Alternatives rejected**: Admin app/module mới; shared monorepo package mới; thay state/query libraries.

## Decision 2: Server authorization remains decisive

**Decision**: Dùng global security guard + explicit `@Authorize('admin')` trên admin endpoints, cùng application invariant cho target admin account.  
**Rationale**: Route guard UI có thể bị bypass; invariant target role không chỉ là route authorization mà là business rule cần được kiểm tra trước persistence.  
**Alternatives rejected**: Chỉ ẩn button; chỉ dựa vào `/admin` URL prefix; thêm `superadmin`.

## Decision 3: Preserve general ledger compatibility

**Decision**: Chọn `GET /admin/ledger/platform-balance` làm endpoint admin-only cho platform revenue balance và bảo vệ endpoint bằng `@Authorize('admin')`.
**Rationale**: Biến general balance API thành admin-only có thể phá contract hiện có. Admin-specific controller có thể reuse `GetBalanceUseCase` và fixed selector `platform/revenue/VND`.  
**Alternatives rejected**: UI gửi arbitrary owner selector trên endpoint không bảo vệ; khóa toàn ledger module mà không audit consumer.

**Post-rebase consumer evidence**: Repository search found `admin-ui/src/features/ledger/services/ledger-service.ts` as the only caller of `/ledger/accounts/balance`. The generic controller remains unchanged; Rentify Admin moves to the fixed admin-only endpoint.

## Decision 4: No mock dashboard data

**Decision**: Dashboard chỉ hiển thị platform balance thật, total users, total properties, pending KYC count từ API thật và navigation shortcuts; loại recent bookings, hard-coded KPI và mọi KPI khác.
**Rationale**: Spec cấm mock data và không bao gồm booking management. `total` từ APIs danh sách có thể cung cấp counts mà không cần analytics subsystem.  
**Alternatives rejected**: Giữ placeholder demo; tạo analytics API mới không cần thiết.

## Decision 5: Confirmation uses installed UI primitives

**Decision**: Dùng `Dialog`/`Button` hiện có, colocate confirmation theo feature hoặc share khi thực sự lặp.  
**Rationale**: Không cần dependency mới; cho phép mô tả target/action và quản lý pending state.  
**Alternatives rejected**: `window.confirm`; thêm modal library.

## Decision 6: Query invalidation is source-of-truth synchronization

**Decision**: Sau success invalidate feature root query key; sau conflict/stale error refetch relevant query. Không optimistic update cho moderation actions.  
**Rationale**: Status transitions có business validation; server response/persisted state phải quyết định.  
**Alternatives rejected**: Chỉ mutate local array; reload toàn browser.

## Decision 7: Property activation follows publish prerequisites

**Decision**: Activation luôn yêu cầu host KYC `verified` và license của property `verified`, kể cả khi `requiresLocalLicense` là false. Admin không được override điều kiện nào.
**Rationale**: Đây là quyết định product đã xác nhận cho moderation activation; admin status mutation phải enforce cả hai invariant trước persistence.
**Alternatives rejected**: Giữ unconditional repository status update.  

## Decision 8: KYC provider mock is not part of Admin UI data mocking

**Decision**: Không thay provider KYC trong feature này; admin queue/review phải đọc và ghi submissions persisted qua API thật.  
**Rationale**: Thay external KYC provider là scope lớn khác; yêu cầu “không mock data” áp dụng trực tiếp cho Admin screens/demo records.  
**Alternatives rejected**: Tích hợp vendor KYC mới trong demo-readiness feature.

## Decision 9: UI state matrices are flow-specific

**Decision**: Data screens require loading, empty, error, unauthorized and success. Login instead requires idle, loading, validation error, authentication error, unauthorized and success redirect, with no empty state.
**Rationale**: Empty has meaning for a data result set, not an authentication form; validation, credential failure and role denial are distinct observable login outcomes.

## Reinspection after latest origin/main rebase

Reinspection at `ba924ea` over `origin/main` `fcf558d` confirmed the current code still contains unconditional admin property status updates, unconditional account status updates, mock dashboard KPIs/recent bookings, and existing auth/data feature slices. The implementation plan and tasks below target these current paths rather than the pre-rebase inventory.

