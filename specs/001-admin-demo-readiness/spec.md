# Feature Specification: Rentify Admin Demo Readiness

**Feature Branch**: `001-admin-demo-readiness`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: Hoàn thiện Rentify Admin hiện có để trình diễn, tận dụng code và API hiện có, không xây lại và không mở rộng ngoài phạm vi quản trị được nêu.

## Clarifications

### Session 2026-08-20

- Q: Admin có được thay đổi trạng thái tài khoản role `admin`, gồm chính mình hoặc admin khác không? → A: Không. Chỉ tài khoản role `guest` hoặc `host` được phép đổi trạng thái. Backend phải trả `403 Forbidden` với thông báo rõ ràng cho mọi yêu cầu đổi trạng thái tài khoản admin. Frontend ẩn hoặc disable hành động này, nhưng backend là lớp quyết định. Không bổ sung role `superadmin`.
- Q: Admin có được bypass KYC hoặc license khi activate property không? → A: Không. Mọi property chỉ được chuyển sang `active` khi host KYC đã `verified` và chính property có license `verified`; hai điều kiện luôn bắt buộc, không phụ thuộc `requiresLocalLicense` và không có admin override.
- Q: Dashboard được phép hiển thị dữ liệu nào? → A: Chỉ platform balance thật, total users, total properties, pending KYC count lấy từ API thật, và navigation shortcuts. Loại bỏ mọi mock KPI và recent bookings.
- Q: Các state UI bắt buộc áp dụng thế nào? → A: Mọi màn hình/vùng dữ liệu phải có loading, empty, error, unauthorized và success. Riêng login có idle, loading, validation error, authentication error, unauthorized và success redirect; login không có empty state.
- Q: Sau rebase cần dựa trên code nào? → A: Reinspect code tại branch hiện tại sau latest `origin/main` rebase trước khi chốt plan/tasks; không dựa trên inventory cũ.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Admin Access (Priority: P1)

Là quản trị viên, tôi đăng nhập bằng tài khoản có role `admin` và truy cập dashboard. Tài khoản `guest`, `host`, người chưa đăng nhập, hoặc phiên đăng nhập không còn hợp lệ không thể xem dữ liệu hay thực hiện hành động quản trị.

**Why this priority**: Đây là điều kiện an toàn và là điểm vào của toàn bộ demo. Không có phân quyền backend thì mọi tính năng quản trị phía sau đều không thể chấp nhận.

**Independent Test**: Đăng nhập lần lượt bằng admin, guest, host; gọi trực tiếp từng API quản trị với token tương ứng và không có token; xác nhận chỉ admin nhận dữ liệu/thực hiện mutation.

**Acceptance Scenarios**:

1. **Given** tài khoản admin hợp lệ và đang active, **When** đăng nhập đúng thông tin, **Then** hệ thống lưu phiên đăng nhập, thông báo thành công và điều hướng đến dashboard.
2. **Given** tài khoản guest hoặc host đăng nhập hợp lệ, **When** truy cập Admin UI, **Then** hệ thống hiển thị trạng thái unauthorized/access denied, không render dữ liệu dashboard và không cho vào các trang quản trị.
3. **Given** người dùng chưa đăng nhập hoặc token hết hạn/không hợp lệ, **When** truy cập trang quản trị, **Then** hệ thống không hiển thị dữ liệu bảo vệ và đưa người dùng về luồng đăng nhập với thông báo phù hợp.
4. **Given** token guest, host hoặc không có token, **When** gọi trực tiếp API accounts, properties/license, KYC hoặc platform balance dành cho Admin UI, **Then** backend trả về 403 hoặc 401 phù hợp và không trả dữ liệu được bảo vệ.
5. **Given** thông tin đăng nhập sai hoặc server lỗi, **When** gửi form đăng nhập, **Then** trạng thái loading kết thúc, lỗi được hiển thị rõ và người dùng có thể thử lại.

---

### User Story 2 - View Operational Overview and Platform Balance (Priority: P1)

Là quản trị viên đã đăng nhập, tôi xem dashboard tổng quan với platform ledger balance, total users, total properties, pending KYC count từ API thật và các lối tắt đến Users, Properties, KYC.

**Why this priority**: Dashboard là màn hình đầu tiên của luồng demo và platform balance là một yêu cầu nghiệp vụ cụ thể.

**Independent Test**: Với dữ liệu thật có sẵn, mở dashboard và đối chiếu platform ledger balance với API; kiểm tra loading, empty/unavailable, error, unauthorized và success mà không xuất hiện số liệu giả.

**Acceptance Scenarios**:

1. **Given** admin hợp lệ và platform ledger account tồn tại, **When** mở dashboard, **Then** balance thực tế và đơn vị tiền tệ được hiển thị từ API.
2. **Given** truy vấn balance đang xử lý, **When** dashboard render, **Then** hiển thị loading state ổn định thay vì số 0 hoặc dữ liệu cũ gây hiểu nhầm.
3. **Given** chưa có platform ledger account hoặc chưa có dữ liệu tổng quan, **When** API trả kết quả rỗng hợp lệ, **Then** dashboard hiển thị empty/unavailable state rõ ràng và không tự tạo số liệu mẫu.
4. **Given** API tổng quan hoặc balance lỗi, **When** dashboard nhận lỗi, **Then** hiển thị error state và hành động thử lại mà không làm hỏng toàn trang.
5. **Given** admin xem dashboard thành công, **When** chọn lối tắt Users, Properties hoặc KYC, **Then** được điều hướng đúng đến màn hình tương ứng.
6. **Given** các API danh sách trả dữ liệu, **When** dashboard render thành công, **Then** total users, total properties và pending KYC count khớp metadata/kết quả API thật; không hiển thị KPI nào khác hoặc recent bookings.

---

### User Story 3 - Search, Filter, and Manage Users (Priority: P1)

Là quản trị viên, tôi xem danh sách người dùng, tìm kiếm theo thông tin được API hỗ trợ, lọc theo role và trạng thái, rồi thay đổi trạng thái một tài khoản sau khi xác nhận.

**Why this priority**: Quản lý tài khoản là luồng quản trị cốt lõi, đã có nền tảng UI/API và phù hợp để trình diễn end-to-end.

**Independent Test**: Tìm một tài khoản thật, kết hợp bộ lọc, đổi trạng thái sau xác nhận, rồi tải lại danh sách để xác nhận trạng thái đã được lưu.

**Acceptance Scenarios**:

1. **Given** có tài khoản trong hệ thống, **When** admin mở Users, **Then** danh sách phân trang từ API được hiển thị với thông tin và trạng thái hiện tại.
2. **Given** admin nhập từ khóa hoặc chọn role/status, **When** bộ lọc được áp dụng, **Then** danh sách quay về trang đầu và chỉ hiển thị kết quả phù hợp theo contract hiện có.
3. **Given** không có tài khoản khớp tìm kiếm/bộ lọc, **When** truy vấn hoàn tất, **Then** hiển thị empty state có cách xóa hoặc điều chỉnh bộ lọc.
4. **Given** admin chọn trạng thái mới, **When** chưa xác nhận, **Then** chưa có mutation nào được gửi; khi hủy xác nhận, trạng thái không thay đổi.
5. **Given** admin xác nhận thay đổi trạng thái, **When** backend cập nhật thành công, **Then** hiển thị thông báo thành công và refresh/invalidate dữ liệu để bảng phản ánh trạng thái đã lưu.
6. **Given** mutation thất bại hoặc bị từ chối, **When** backend trả lỗi, **Then** hiển thị thông báo lỗi, dữ liệu cũ vẫn nhất quán và admin có thể thử lại.
7. **Given** hàng trong danh sách là tài khoản role `admin`, **When** admin xem các hành động khả dụng, **Then** hành động đổi trạng thái bị ẩn hoặc disable rõ ràng.
8. **Given** admin gọi trực tiếp API để đổi trạng thái chính mình hoặc bất kỳ admin nào khác, **When** backend xử lý request, **Then** trả `403 Forbidden` với thông báo rõ ràng và không thay đổi account status.

---

### User Story 4 - Search, Filter, Review, and Manage Properties (Priority: P1)

Là quản trị viên, tôi xem, tìm kiếm và lọc properties, xem giấy phép đã nộp, rồi thay đổi trạng thái property sau bước xác nhận.

**Why this priority**: Đây là luồng kiểm soát listing trực tiếp tác động đến nội dung được cung cấp trên Rentify.

**Independent Test**: Tìm một property thật, xem giấy phép, thay đổi trạng thái sau xác nhận và tải lại để kiểm tra dữ liệu persisted.

**Acceptance Scenarios**:

1. **Given** có properties trong hệ thống, **When** admin mở Properties, **Then** danh sách phân trang từ API được hiển thị với trạng thái hiện tại.
2. **Given** admin nhập từ khóa hoặc chọn status/host filter được UI cung cấp, **When** áp dụng bộ lọc, **Then** danh sách quay về trang đầu và phản ánh kết quả từ API.
3. **Given** không có property khớp, **When** truy vấn hoàn tất, **Then** hiển thị empty state và cách điều chỉnh bộ lọc.
4. **Given** property có giấy phép, **When** admin chọn xem giấy phép, **Then** hiển thị metadata và tài liệu/đường dẫn thực tế mà API cung cấp trong loading, error hoặc success state phù hợp.
5. **Given** property chưa nộp giấy phép, **When** admin mở phần giấy phép, **Then** hiển thị empty state rõ ràng, không coi đó là runtime error.
6. **Given** admin chọn trạng thái mới, **When** chưa xác nhận hoặc hủy, **Then** không gửi mutation và không đổi trạng thái.
7. **Given** admin xác nhận thay đổi, **When** backend cập nhật thành công, **Then** có thông báo thành công và dữ liệu property được refresh/invalidate đúng; nếu thất bại, có thông báo lỗi và giữ dữ liệu nhất quán.
8. **Given** host KYC chưa verified hoặc property chưa có license verified, **When** admin cố activate property, **Then** backend từ chối và không đổi trạng thái; admin không thể bypass bất kỳ prerequisite nào.

---

### User Story 5 - Review KYC Queue (Priority: P1)

Là quản trị viên, tôi xem hàng đợi KYC, kiểm tra tài liệu và duyệt hoặc từ chối một submission; khi từ chối tôi phải nhập lý do.

**Why this priority**: KYC là luồng duyệt thủ công nhạy cảm và là một phần được yêu cầu trực tiếp trong demo.

**Independent Test**: Mở một submission pending thật, duyệt một submission; mở submission khác, nhập lý do và từ chối; xác nhận cả hai biến mất khỏi hàng đợi sau refresh.

**Acceptance Scenarios**:

1. **Given** có KYC pending, **When** admin mở KYC Queue, **Then** danh sách từ API và thông tin cần thiết để nhận diện submission được hiển thị.
2. **Given** không có KYC pending, **When** truy vấn hoàn tất, **Then** hiển thị empty state xác nhận hàng đợi đã sạch.
3. **Given** admin xem một submission, **When** tài liệu sẵn có, **Then** admin có thể kiểm tra dữ liệu/tài liệu thực tế trước khi quyết định.
4. **Given** admin chọn Approve, **When** chưa xác nhận, **Then** không gửi mutation; sau khi xác nhận và backend thành công, hiển thị thông báo và refresh hàng đợi.
5. **Given** admin chọn Reject, **When** lý do trống hoặc chỉ có khoảng trắng, **Then** không cho gửi; khi có lý do hợp lệ và xác nhận, backend lưu quyết định kèm lý do, UI thông báo và refresh hàng đợi.
6. **Given** review thất bại hoặc submission đã được xử lý bởi người khác, **When** backend trả lỗi, **Then** UI thông báo rõ, đóng/giữ dialog hợp lý và refresh dữ liệu để tránh quyết định dựa trên trạng thái cũ.

### Edge Cases

- Token hết hạn trong khi admin đang ở dashboard hoặc đang mở confirmation: mutation không được coi là thành công; dữ liệu bảo vệ bị ẩn và người dùng được đưa về luồng đăng nhập.
- Tài khoản hoặc property bị cập nhật bởi tác nhân khác giữa lúc mở confirmation và lúc xác nhận: UI dùng kết quả backend làm nguồn sự thật và refresh danh sách.
- Request đổi trạng thái nhắm đến tài khoản admin, kể cả tài khoản đang đăng nhập: backend luôn trả 403 và không ghi thay đổi, bất kể UI hoặc payload được thao tác thế nào.
- Người dùng tìm kiếm với khoảng trắng, ký tự Unicode tiếng Việt, hoặc chuỗi không có kết quả: không gây lỗi runtime và trạng thái bộ lọc vẫn rõ ràng.
- Trang hiện tại không còn hợp lệ sau khi lọc hoặc mutation làm giảm tổng số bản ghi: UI trở về một trang hợp lệ.
- URL giấy phép/KYC thiếu, sai hoặc không tải được: phần xem tài liệu báo lỗi riêng và không làm hỏng danh sách hay toàn màn hình.
- Network chậm, request lặp hoặc admin bấm mutation nhiều lần: nút bị vô hiệu hóa trong khi gửi và không tạo hành động trùng lặp từ UI.
- API trả 401 khác với 403: UI phân biệt phiên không hợp lệ (yêu cầu đăng nhập lại) và tài khoản không đủ quyền (unauthorized/access denied).
- Platform ledger chưa có account phù hợp: UI thể hiện chưa có dữ liệu; không hiển thị balance giả và không tự tạo giao dịch.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST dùng luồng đăng nhập và token API hiện có cho Admin UI; MUST chỉ cho tài khoản role `admin` vào các màn hình quản trị.
- **FR-002**: Backend MUST xác thực JWT và kiểm tra role `admin` cho mọi API được Admin UI sử dụng để đọc hoặc mutate accounts, properties/license, KYC và platform ledger balance.
- **FR-003**: Backend MUST trả 401 khi thiếu/sai/hết hạn xác thực và 403 khi tài khoản hợp lệ nhưng không có role admin, không kèm dữ liệu bảo vệ.
- **FR-004**: Admin UI MUST xử lý phiên chưa khởi tạo, chưa đăng nhập, hết hạn và non-admin mà không thoáng render dữ liệu quản trị trước khi guard hoàn tất.
- **FR-005**: Dashboard MUST chỉ hiển thị platform ledger balance, total users, total properties và pending KYC count từ API thật, cùng navigation shortcuts; balance MUST gồm số dư và currency.
- **FR-006**: Dashboard MUST loại bỏ recent bookings, hard-coded/mock KPI, mọi KPI khác và simulated fallback; dữ liệu rỗng/lỗi MUST được thể hiện bằng state tương ứng, không bằng số liệu giả.
- **FR-007**: Users MUST hỗ trợ danh sách phân trang, tìm kiếm theo email/tên, lọc role và lọc status bằng contract hiện có.
- **FR-008**: Admin MUST chỉ có thể đổi account status của tài khoản role `guest` hoặc `host` trong tập giá trị backend hiện hỗ trợ; hành động MUST có confirmation hiển thị đối tượng và trạng thái đích.
- **FR-008a**: Backend MUST từ chối mọi yêu cầu đổi trạng thái tài khoản role `admin`, bao gồm chính caller và admin khác, bằng `403 Forbidden` với thông báo rõ ràng; account status MUST không thay đổi.
- **FR-008b**: Admin UI MUST ẩn hoặc disable hành động đổi trạng thái trên mọi tài khoản role `admin`, nhưng MUST không được coi biện pháp UI này là lớp bảo vệ quyết định.
- **FR-009**: Properties MUST hỗ trợ danh sách phân trang, tìm kiếm theo title/city và lọc theo các tiêu chí contract hiện có mà UI đưa ra.
- **FR-010**: Admin MUST xem được giấy phép property qua API thật; trường hợp chưa có giấy phép MUST được xử lý như empty state hợp lệ.
- **FR-011**: Admin MUST có thể đổi property status trong tập chuyển trạng thái backend cho phép; hành động MUST có confirmation hiển thị property và trạng thái đích. Chuyển sang `active` MUST luôn yêu cầu host KYC `verified` và property license `verified`; admin MUST NOT bypass hai prerequisite này.
- **FR-012**: KYC Queue MUST lấy các submission pending từ API thật và cho phép mở thông tin/tài liệu cần review.
- **FR-013**: Approve KYC MUST yêu cầu confirmation trước khi gửi mutation.
- **FR-014**: Reject KYC MUST yêu cầu lý do không rỗng và confirmation trước khi gửi; backend MUST lưu quyết định, reviewer và rejection reason theo domain hiện có.
- **FR-015**: Mọi mutation MUST khóa hoặc vô hiệu hóa trigger liên quan trong khi request đang chạy, hiển thị thông báo success/error, và invalidate/refetch dữ liệu liên quan sau kết quả thành công.
- **FR-016**: Với lỗi conflict/stale-data sau mutation, Admin UI MUST refresh dữ liệu liên quan để phản ánh trạng thái backend mới nhất.
- **FR-017**: Mọi màn hình/vùng dữ liệu trong phạm vi MUST có loading, empty, error, unauthorized và success phù hợp; error state SHOULD có retry khi request có thể thử lại.
- **FR-017a**: Login MUST có idle, loading, validation error, authentication error, unauthorized và success redirect; login MUST NOT được yêu cầu hoặc hiển thị empty state.
- **FR-018**: Search/filter MUST đặt pagination về trang đầu và MUST giữ UI đồng bộ với query đang hiển thị.
- **FR-019**: Thay đổi MUST tận dụng module, feature, hook, service, component và API hiện có; MUST không xây lại Admin UI/server từ đầu.
- **FR-020**: Production UI MUST không thêm mock data, hard-coded business records hoặc simulated API responses.
- **FR-021**: Thay đổi backend MUST giữ Clean Architecture hiện có và không làm thay đổi contract guest/host ngoài phần tối thiểu cần thiết để bảo vệ API Admin.
- **FR-022**: Không được thêm dependency mới trừ khi chứng minh công cụ hiện có không đáp ứng; mặc định implementation MUST dùng dependency đã cài.
- **FR-023**: Sau mỗi phase implementation, package bị ảnh hưởng MUST được lint/test/build theo constitution; trước demo, `admin-ui` và `server` MUST build thành công.

### Key Entities

- **Admin Session**: Phiên xác thực gồm token, account identity, role và trạng thái hợp lệ; quyết định quyền truy cập Admin UI/API.
- **Account**: Người dùng Rentify với identity, tên/email, role (`guest`, `host`, `admin`) và account status; là đối tượng tìm kiếm, lọc và cập nhật trạng thái.
- **Property**: Listing thuộc host, gồm identity, title/location, host và lifecycle status; có thể liên kết một giấy phép.
- **Property License**: Hồ sơ giấy phép thực tế của property, gồm metadata, trạng thái và tham chiếu tài liệu nếu có.
- **KYC Document/Submission**: Hồ sơ định danh chờ review, gắn với account và tài liệu; có trạng thái review, reviewer và rejection reason khi bị từ chối.
- **Ledger Balance**: Số dư của platform ledger account theo subtype/currency mà contract hiện có yêu cầu; chỉ đọc trong phạm vi tính năng này.

## Assumptions and Dependencies

- Có ít nhất một tài khoản admin active phục vụ demo; việc xây giao diện tạo/promote admin không thuộc phạm vi.
- Dữ liệu demo thật (users, properties, licenses, KYC pending và ledger account) được seed/chuẩn bị qua cơ chế server/database hiện có, không hard-code trong Admin UI.
- Contract hiện có tiếp tục dùng các endpoint `auth`, `admin/accounts`, `admin/properties`, `admin/kyc` và ledger balance; chỉ chỉnh tối thiểu khi cần bảo vệ platform balance hoặc hoàn thiện trạng thái.
- Search/filter giữ semantics backend hiện có; không bổ sung search engine hay bộ lọc mới ngoài những trường đã nêu.
- Dịch vụ PostgreSQL và các dependency hạ tầng cần cho luồng demo được cấu hình trong môi trường demo.

## Out of Scope

- Xây lại giao diện, design system, auth system hoặc kiến trúc server.
- Quản lý bookings, payouts, refunds, disputes, taxes, ledger transactions hoặc báo cáo tài chính.
- Tạo/chỉnh sửa/xóa người dùng hay property ngoài các thay đổi status được nêu.
- Bổ sung role `superadmin` hoặc bất kỳ cấp quản trị mới nào.
- Rescreen KYC, KYC submission phía guest/host, thay nhà cung cấp KYC, hoặc mở rộng quy trình compliance.
- Thêm dashboard analytics, biểu đồ, recent bookings hoặc KPI không có API thật hiện hữu.
- Thay đổi trải nghiệm guest/host, trừ sửa tương thích bắt buộc do bảo vệ contract quản trị.
- Đồng bộ Meilisearch như một tính năng demo độc lập; chỉ giữ nếu cần thiết cho API search hiện hữu và đã hoạt động.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Một admin có thể hoàn thành liên tục luồng demo: login → dashboard/balance → tìm/lọc user và đổi status → tìm/lọc property, xem license và đổi status → duyệt/từ chối KYC, không gặp lỗi runtime nghiêm trọng.
- **SC-002**: 100% API quản trị trong phạm vi từ chối request không token và token guest/host; request admin hợp lệ nhận kết quả theo contract.
- **SC-002a**: 100% yêu cầu đổi trạng thái tài khoản role `admin` bị backend từ chối bằng 403, không phụ thuộc caller là chính tài khoản đó hay admin khác; không có bản ghi admin nào bị thay đổi.
- **SC-003**: 100% mutation trong phạm vi có confirmation trước request, feedback sau request, ngăn submit lặp trong khi pending và phản ánh dữ liệu persisted sau refresh/invalidation.
- **SC-004**: 100% màn hình/vùng dữ liệu có loading, empty, error, unauthorized và success; riêng login có đủ idle, loading, validation error, authentication error, unauthorized và success redirect mà không có empty state.
- **SC-005**: Không còn mock/hard-coded business records trên dashboard hoặc các màn hình quản trị trong phạm vi; dữ liệu trình diễn truy xuất từ API thật.
- **SC-006**: Tìm kiếm/lọc trả đúng tập kết quả và trở về trang đầu trong tất cả kịch bản nghiệm thu Users và Properties.
- **SC-007**: `admin-ui` và `server` build thành công; các lint/test áp dụng cho phần thay đổi không có lỗi chưa được giải trình.
- **SC-008**: Các luồng guest/host hiện có và API contract dùng chung không có regression nghiêm trọng qua targeted validation.
