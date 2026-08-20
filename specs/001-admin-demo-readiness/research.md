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

**Decision**: Xác minh consumer của `/ledger/accounts/balance`; ưu tiên admin-specific read endpoint cho platform revenue nếu general endpoint phục vụ guest/host.  
**Rationale**: Biến general balance API thành admin-only có thể phá contract hiện có. Admin-specific controller có thể reuse `GetBalanceUseCase` và fixed selector `platform/revenue/VND`.  
**Alternatives rejected**: UI gửi arbitrary owner selector trên endpoint không bảo vệ; khóa toàn ledger module mà không audit consumer.

## Decision 4: No mock dashboard data

**Decision**: Dashboard chỉ hiển thị platform balance thật và những counts lấy được từ list APIs hiện có; loại recent bookings/hard-coded KPI.  
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

**Decision**: Tạm thời plan activation yêu cầu host KYC verified và verified license nếu `requiresLocalLicense`.  
**Rationale**: Đây là rule domain hiện có trong `Property.publish`; admin override không nên vô hiệu hóa an toàn nghiệp vụ nếu chưa có quyết định product rõ ràng.  
**Alternatives rejected**: Giữ unconditional repository status update.  
**Open dependency**: Product có thể thay đổi quyết định này; cần amend spec/plan trước implementation nếu cho phép override.

## Decision 8: KYC provider mock is not part of Admin UI data mocking

**Decision**: Không thay provider KYC trong feature này; admin queue/review phải đọc và ghi submissions persisted qua API thật.  
**Rationale**: Thay external KYC provider là scope lớn khác; yêu cầu “không mock data” áp dụng trực tiếp cho Admin screens/demo records.  
**Alternatives rejected**: Tích hợp vendor KYC mới trong demo-readiness feature.

