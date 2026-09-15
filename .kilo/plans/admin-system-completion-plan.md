# Kế hoạch hoàn thiện hệ thống Admin Rentify

## Mục tiêu

Hoàn thiện đầy đủ chức năng Admin cho Rentify (Backend + Frontend), chia thành 4 phase. Kiến trúc tuân thủ Clean Architecture 4 lớp đã có sẵn trong project (Presentation → Application → Domain → Infrastructure). Mỗi task được tách nhỏ để có thể giao cho AI Agent xử lý độc lập.

---

## Trạng thái hiện tại (đã xác minh với codebase)

| Khu vực | Trạng thái | Ghi chú |
| --- | :---: | --- |
| Admin UI login page + role guard | ✅ | `admin-ui/src/app/login/` + layout guard `user.role !== 'admin'` |
| Admin UI sidebar nav (6 mục) | ✅ | Overview, Users, Properties, KYC, **Bookings**, **Ledger** |
| BE: `admin/accounts` (list, update status) | ✅ | `admin-accounts.controller.ts` với `@Authorize('admin')` |
| BE: `admin/kyc` (pending, review, rescreen) | ✅ | `admin-kyc.controller.ts` với `@Authorize('admin')` |
| BE: `admin/properties` (list, license, status) | ✅ | `admin-listings.controller.ts` với `@Authorize('admin')` |
| FE: page `/users` + filter + table + actions | ✅ | `features/users/` có types, services, hooks, components |
| FE: page `/properties` + filter + table + actions | ✅ | `features/properties/` có types, services, hooks, components |
| FE: page `/kyc` + review queue | ✅ | `features/kyc/` có types, services, hooks, components |
| FE: page `/bookings` | ❌ | Nav link tồn tại nhưng **không có folder page** |
| FE: page `/ledger` | ❌ | Nav link tồn tại nhưng **không có folder page** |
| Dashboard KPI (Total Users, Active Listings, Pending KYC) | ⚠️ | **Hardcode** giá trị giả (1,248 / 312 / 5) |
| Dashboard Platform Revenue | ✅ | Gọi API thật qua `useLedgerQueries()` |
| Dashboard Recent Bookings | ⚠️ | **Mock data** (3 objects giả) |
| BE: `bookings/host` approve/decline | ✅ | Nằm trong `bookings.controller.ts` (dùng if-check role, không có `@Authorize`) |
| BE: ledger get-balance, post-transaction | ✅ | `ledger.controller.ts` (dùng `JwtAuthGuard`, **không có** `@Authorize('admin')`) |
| Tài khoản admin trong DB | ❌ | `accounts` table có 0 rows `role = admin`, seed chưa tạo |
| BE: Admin list-all bookings | ❌ | Không có endpoint, repository thiếu `findAll(filter)` |
| BE: Admin list ledger transactions/balances/payouts | ❌ | Không có endpoint, repository thiếu `findAllTransactions()` |
| Cancellation overrides (admin) | ❌ | Schema có columns `override_*` nhưng chưa có API |
| Host penalties (admin CRUD) | ❌ | Table `host_penalties` tồn tại, chưa có API |
| Superhost toggle (admin) | ❌ | `host_profiles.is_superhost` có, chưa có API |
| `platform_config` (fee_rules) | ⚠️ | Data tồn tại `{"default_pct": 12}`, chưa có admin API CRUD |
| `cancellation_policies` | ✅ | 6 policies đã seed qua migration |

> [!IMPORTANT]
> **Admin-ui chạy trên port 3001** (đã config sẵn trong `package.json` → `next dev -p 3001`).
> **Admin-ui dùng localStorage key `rentify_admin_token`** (khác với client dùng `rentify_token`).

---

## Phase 0: Bootstrap — Tạo tài khoản Admin

**Mục tiêu:** Có thể đăng nhập vào admin-ui.

**Dependency:** Không có (chạy đầu tiên).

---

### Task 0.1 — Seed admin account vào database

**Mô tả:** Thêm admin account vào script seed hiện có để tạo tài khoản admin mặc định có thể đăng nhập được.

**File cần sửa:**
- [MODIFY] [insert-postgres.js](file:///home/thiennk/Documents/introduction/server/scripts/insert-postgres.js)

**Chi tiết:**
1. Thêm constant `ADMIN_ID` (UUID cố định) ở đầu file, cạnh `HOST_ID` và `GUEST_ID`.
2. Trong block `INSERT INTO accounts`, thêm 1 row admin: `(ADMIN_ID, 'admin@rentify.com', 'admin', 'active', <bcrypt_hash_of_'admin123'>, NOW(), NOW())`.
3. Trong block `INSERT INTO profiles`, thêm profile cho admin: `(ADMIN_ID, 'System', 'Admin', null, 'Platform administrator', NOW(), NOW())`.
4. Password hash phải dùng bcrypt với `saltRounds = 10`. Có thể generate bằng lệnh: `node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"`.

**Tham chiếu:** Xem pattern hiện có ở dòng 156–175 của [insert-postgres.js](file:///home/thiennk/Documents/introduction/server/scripts/insert-postgres.js#L156-L175).

**Xác minh:**
```bash
cd server && npm run seed
docker exec rentify-postgres psql -U rentify -d rentify -c "SELECT email, role FROM accounts WHERE role = 'admin';"
# Phải trả về 1 row: admin@rentify.com | admin
```

---

### Task 0.2 — Tạo file `.env` cho admin-ui

**Mô tả:** Admin-ui hiện thiếu file `.env` → fallback về `http://127.0.0.1:8080`. Tạo file để có thể config rõ ràng.

**File cần tạo:**
- [NEW] [.env](file:///home/thiennk/Documents/introduction/admin-ui/.env)

**Nội dung:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Xác minh:** `cd admin-ui && npm run dev` → mở `http://localhost:3001/login` → đăng nhập bằng `admin@rentify.com` / `admin123` → redirect về Dashboard.

---

## Phase 1: Bookings Admin (BE + FE)

**Mục tiêu:** Admin có thể xem tất cả bookings trên hệ thống, xem chi tiết, approve/decline/cancel từ trang admin.

**Dependency:** Phase 0 (cần admin account để test).

---

### Task 1.1 — BE: Thêm `findAll(filter)` vào BookingsRepository

**Mô tả:** Repository hiện chỉ có `findManyByGuestId` và `findManyByHostId`. Cần thêm method cho admin list-all với phân trang + filter.

**File cần sửa:**
- [MODIFY] [bookings.repository.ts](file:///home/thiennk/Documents/introduction/server/src/modules/bookings/domain/repositories/bookings.repository.ts) — thêm abstract method + filter/paginated types
- [MODIFY] [bookings.prisma.repository.ts](file:///home/thiennk/Documents/introduction/server/src/modules/bookings/infrastructure/persistence/bookings.prisma.repository.ts) — implement method

**Chi tiết:**
1. Trong `bookings.repository.ts`, thêm:
   ```typescript
   export interface FindAllBookingsFilter {
      status?: string
      guestId?: string
      hostId?: string
      propertyId?: string
      page: number
      limit: number
   }
   export interface PaginatedBookings {
      data: Booking[]
      total: number
      page: number
      limit: number
   }
   abstract findAll(filter: FindAllBookingsFilter): Promise<PaginatedBookings>
   abstract findByIdWithRelations(id: string): Promise<{booking: Booking, payment: Payment | null} | null>
   ```
2. Trong `bookings.prisma.repository.ts`, implement với Prisma `findMany` + `count`, filter bằng `where` clause, sort `created_at DESC`, include `payments` (lấy phần tử đầu).

**Tham chiếu:** Xem pattern tương tự trong [auth.repository.ts](file:///home/thiennk/Documents/introduction/server/src/modules/auth/domain/repositories/auth.repository.ts) → `FindAllAccountsFilter` + `PaginatedAccounts`.

---

### Task 1.2 — BE: Tạo ListAllBookingsUseCase

**Mô tả:** Use case mới cho admin list tất cả bookings.

**File cần tạo:**
- [NEW] `server/src/modules/bookings/application/use-cases/list-all-bookings.usecase.ts`

**Chi tiết:**
1. `ListAllBookingsCommand` nhận: `status?`, `guestId?`, `hostId?`, `propertyId?`, `page`, `limit`.
2. Use case gọi `bookingsRepository.findAll(filter)` và trả về `PaginatedBookings`.

**Tham chiếu:** Mô theo [list-accounts.usecase.ts](file:///home/thiennk/Documents/introduction/server/src/modules/auth/application/use-cases/list-accounts.usecase.ts).

---

### Task 1.3 — BE: Tạo AdminBookingsController

**Mô tả:** Controller admin-only cho bookings management.

**File cần tạo:**
- [NEW] `server/src/modules/bookings/presentation/controllers/admin-bookings.controller.ts`

**File cần sửa:**
- [MODIFY] [bookings.module.ts](file:///home/thiennk/Documents/introduction/server/src/modules/bookings/bookings.module.ts) — thêm controller + use case vào module

**Chi tiết:**
1. `@Controller('admin/bookings')`, `@ApiTags('Admin - Bookings')`, `@ApiBearerAuth('bearer')`.
2. Endpoints:
   - `GET /` — `@Authorize('admin')` — list all bookings với filter (status, guestId, hostId, propertyId, page, limit). Dùng `ListAllBookingsUseCase`.
   - `GET /:id` — `@Authorize('admin')` — chi tiết booking. Reuse `GetBookingDetailsUseCase` (truyền role `'admin'`).
   - `POST /:id/approve` — `@Authorize('admin')` — reuse `ApproveBookingUseCase`.
   - `POST /:id/decline` — `@Authorize('admin')` — reuse `DeclineBookingUseCase`.
   - `POST /:id/cancel` — `@Authorize('admin')` — reuse `CancelBookingUseCase` (truyền role `'admin'`).
3. Reuse `BookingsMapper` cho response format.

**Tham chiếu:** Mô theo [admin-listings.controller.ts](file:///home/thiennk/Documents/introduction/server/src/modules/listings/presentation/controllers/admin-listings.controller.ts).

---

### Task 1.4 — FE: Tạo `features/bookings` (types, service, hooks)

**Mô tả:** Feature module mới cho bookings admin trong admin-ui.

**File cần tạo:**
- [NEW] `admin-ui/src/features/bookings/types.ts`
- [NEW] `admin-ui/src/features/bookings/services/bookings-service.ts`
- [NEW] `admin-ui/src/features/bookings/hooks/use-bookings-queries.ts`
- [NEW] `admin-ui/src/features/bookings/hooks/use-bookings-mutations.ts`

**Chi tiết:**
1. `types.ts`: Interface `BookingSummary` (id, propertyId, guestId, hostId, status, checkIn, checkOut, guestsCount, totalPriceCents, currency, bookedAt, createdAt), `PaginatedBookings`, `BookingsFilter`.
2. `bookings-service.ts`: Gọi `apiClient.get('/admin/bookings', { params })` cho list, `apiClient.get('/admin/bookings/:id')` cho detail, `apiClient.post('/admin/bookings/:id/approve')` cho approve, tương tự decline/cancel.
3. Hooks: `useBookingsQueries(filter)` dùng `useQuery`, `useBookingsMutations()` dùng `useMutation` + `queryClient.invalidateQueries`.

**Tham chiếu:** Mô theo [features/users/](file:///home/thiennk/Documents/introduction/admin-ui/src/features/users) (types, services, hooks pattern).

---

### Task 1.5 — FE: Tạo `features/bookings` components (table, filter bar)

**Mô tả:** UI components cho bookings admin page.

**File cần tạo:**
- [NEW] `admin-ui/src/features/bookings/components/bookings-filter-bar.tsx`
- [NEW] `admin-ui/src/features/bookings/components/bookings-table.tsx`

**Chi tiết:**
1. `BookingsFilterBar`: Dropdown filter cho `status` (pending, pending_approval, confirmed, cancelled_by_guest, cancelled_by_host, completed, expired), text search, pagination controls.
2. `BookingsTable`: Bảng hiển thị booking list với columns: ID (truncated), Guest, Host, Property, Status (badge màu), Check-in, Check-out, Total, Actions (Approve/Decline/Cancel buttons — hiển thị dựa trên status).

**Tham chiếu:** Mô theo [users-filter-bar.tsx](file:///home/thiennk/Documents/introduction/admin-ui/src/features/users/components/users-filter-bar.tsx) và [users-table.tsx](file:///home/thiennk/Documents/introduction/admin-ui/src/features/users/components/users-table.tsx).

---

### Task 1.6 — FE: Tạo page `/bookings`

**Mô tả:** Page wrapper kết nối filter + table + mutations.

**File cần tạo:**
- [NEW] `admin-ui/src/app/(dashboard)/bookings/page.tsx`
- [NEW] `admin-ui/src/app/(dashboard)/bookings/components/bookings-management-container.tsx`

**Chi tiết:**
1. `page.tsx`: Import và render `BookingsManagementContainer`.
2. `BookingsManagementContainer`: Quản lý state filter, gọi `useBookingsQueries(filter)` và `useBookingsMutations()`, truyền xuống `BookingsFilterBar` và `BookingsTable`.

**Tham chiếu:** Mô theo [users/page.tsx](file:///home/thiennk/Documents/introduction/admin-ui/src/app/(dashboard)/users/page.tsx) và [users-management-container.tsx](file:///home/thiennk/Documents/introduction/admin-ui/src/app/(dashboard)/users/components/users-management-container.tsx).

**Xác minh Phase 1:**
```bash
cd server && npm run lint
cd admin-ui && npm run build
```
Mở `localhost:3001/bookings` → thấy bảng bookings, filter hoạt động, approve/decline/cancel hoạt động.

---

## Phase 2: Ledger & Payouts Admin (BE + FE)

**Mục tiêu:** Admin có thể xem toàn bộ transactions, balances, và payouts trên hệ thống.

**Dependency:** Phase 0.

---

### Task 2.1 — BE: Thêm methods vào LedgerRepository

**Mô tả:** Repository hiện chỉ có find-by-id / find-by-key. Cần thêm list-all cho admin.

**File cần sửa:**
- [MODIFY] [ledger.repository.ts](file:///home/thiennk/Documents/introduction/server/src/modules/ledger/domain/repositories/ledger.repository.ts) — thêm abstract methods + filter types

**Chi tiết:**
1. Thêm interfaces:
   ```typescript
   export interface FindAllTransactionsFilter {
      type?: string
      bookingId?: string
      dateFrom?: Date
      dateTo?: Date
      page: number
      limit: number
   }
   export interface PaginatedTransactions {
      data: LedgerTransaction[]
      total: number
      page: number
      limit: number
   }
   ```
2. Thêm abstract methods:
   - `findAllTransactions(filter: FindAllTransactionsFilter): Promise<PaginatedTransactions>`
   - `findAllBalances(): Promise<LedgerBalance[]>`
   - `findAllPayouts(filter: FindAllPayoutsFilter): Promise<PaginatedPayouts>`

---

### Task 2.2 — BE: Implement LedgerPrismaRepository methods

**File cần sửa:**
- [MODIFY] file Prisma repository tương ứng trong `server/src/modules/ledger/infrastructure/persistence/`

**Chi tiết:** Implement 3 methods mới bằng Prisma `findMany` + `count`, sort `created_at DESC`.

---

### Task 2.3 — BE: Tạo Admin Ledger Use Cases

**File cần tạo:**
- [NEW] `server/src/modules/ledger/application/use-cases/list-all-transactions.usecase.ts`
- [NEW] `server/src/modules/ledger/application/use-cases/list-all-balances.usecase.ts`
- [NEW] `server/src/modules/ledger/application/use-cases/list-all-payouts.usecase.ts`

**Tham chiếu:** Mô theo [list-accounts.usecase.ts](file:///home/thiennk/Documents/introduction/server/src/modules/auth/application/use-cases/list-accounts.usecase.ts).

---

### Task 2.4 — BE: Tạo AdminLedgerController

**File cần tạo:**
- [NEW] `server/src/modules/ledger/presentation/controllers/admin-ledger.controller.ts`

**File cần sửa:**
- [MODIFY] `server/src/modules/ledger/ledger.module.ts` — thêm controller + use cases vào module

**Chi tiết:**
1. `@Controller('admin/ledger')`, `@ApiTags('Admin - Ledger')`.
2. Endpoints:
   - `GET /transactions` — `@Authorize('admin')` — list all transactions + filter
   - `GET /balances` — `@Authorize('admin')` — list all ledger account balances
   - `GET /payouts` — `@Authorize('admin')` — list all payouts + filter (hostId, status, scheduledFor)

**Tham chiếu:** Mô theo [admin-accounts.controller.ts](file:///home/thiennk/Documents/introduction/server/src/modules/auth/presentation/controllers/admin-accounts.controller.ts).

> [!NOTE]
> **Không sửa** `ledger.controller.ts` hiện tại — nó đang được dùng bởi client app và Dashboard overview (lấy platform revenue). Tạo controller mới riêng biệt.

---

### Task 2.5 — FE: Tạo `features/ledger` mở rộng + `features/payouts`

**File cần sửa:**
- [MODIFY] [ledger-service.ts](file:///home/thiennk/Documents/introduction/admin-ui/src/features/ledger/services/ledger-service.ts) — thêm methods gọi admin endpoints

**File cần tạo:**
- [NEW] `admin-ui/src/features/ledger/types.ts`
- [NEW] `admin-ui/src/features/ledger/components/transactions-table.tsx`
- [NEW] `admin-ui/src/features/ledger/components/balances-table.tsx`
- [NEW] `admin-ui/src/features/ledger/components/payouts-table.tsx`
- [NEW] `admin-ui/src/features/ledger/components/ledger-filter-bar.tsx`

**Chi tiết:**
1. `types.ts`: `LedgerTransaction`, `LedgerBalance`, `Payout`, filter types.
2. Mở rộng `ledger-service.ts` (đã có `getPlatformBalance`): thêm `getTransactions(filter)`, `getBalances()`, `getPayouts(filter)`.
3. Mở rộng `use-ledger-queries.ts`: thêm queries cho transactions, balances, payouts.

---

### Task 2.6 — FE: Tạo page `/ledger` với tabs

**File cần tạo:**
- [NEW] `admin-ui/src/app/(dashboard)/ledger/page.tsx`
- [NEW] `admin-ui/src/app/(dashboard)/ledger/components/ledger-management-container.tsx`

**Chi tiết:**
1. Container có 3 tabs: **Transactions**, **Balances**, **Payouts**.
2. Mỗi tab render table + filter tương ứng.
3. BigInt values (amountCents) phải convert sang string trước khi hiển thị (dùng `formatVND()` đã có trong `lib/utils.ts`).

---

### Task 2.7 — BE: Tạo Admin Platform Config API

**File cần tạo:**
- [NEW] `server/src/modules/ledger/application/use-cases/get-platform-config.usecase.ts`
- [NEW] `server/src/modules/ledger/application/use-cases/update-platform-config.usecase.ts`

**File cần sửa:**
- [MODIFY] `admin-ledger.controller.ts` — thêm `GET /config` + `PATCH /config` endpoints

**Chi tiết:**
1. `GET /admin/ledger/config` — `@Authorize('admin')` — trả về `platform_config.fee_rules`.
2. `PATCH /admin/ledger/config` — `@Authorize('admin')` — update `fee_rules` (JSON object).
3. FE: Thêm tab "Settings" trong `/ledger` page, hiển thị form chỉnh `fee_rules`.

**Xác minh Phase 2:**
```bash
cd server && npm run lint
cd admin-ui && npm run build
```
Mở `localhost:3001/ledger` → thấy 3 tabs (Transactions, Balances, Payouts) + Settings tab.

---

## Phase 3: Dashboard thật + Cancellation Overrides + Host Penalties + Superhost

**Mục tiêu:** Dashboard hiển thị số liệu thật, admin có thể can thiệp cancellation, quản lý host penalties, toggle superhost.

**Dependency:** Phase 1 + Phase 2 (cần bookings + ledger API có sẵn).

---

### Task 3.1 — BE: Tạo Dashboard Stats API

**File cần tạo:**
- [NEW] `server/src/modules/auth/application/use-cases/get-admin-stats.usecase.ts`
- [NEW] `server/src/modules/auth/presentation/controllers/admin-stats.controller.ts`

**File cần sửa:**
- [MODIFY] `server/src/modules/auth/auth.module.ts` — thêm controller + use case

**Chi tiết:**
1. `@Controller('admin/stats')`, `@ApiTags('Admin - Stats')`.
2. `GET /overview` — `@Authorize('admin')` — trả về:
   - `totalUsers` — `SELECT COUNT(*) FROM accounts WHERE deleted_at IS NULL`
   - `activeListings` — `SELECT COUNT(*) FROM properties WHERE status = 'active' AND deleted_at IS NULL`
   - `pendingKycCount` — `SELECT COUNT(*) FROM kyc_documents WHERE status = 'pending'`
   - `platformRevenueCents` — dùng `LedgerRepository.findBalanceByAccount('platform', null, 'revenue', 'VND')`
3. `GET /recent-bookings` — `@Authorize('admin')` — trả về 10 bookings gần nhất (join guest + host name).

---

### Task 3.2 — FE: Dashboard thay mock bằng data thật

**File cần sửa:**
- [MODIFY] [overview-dashboard-container.tsx](file:///home/thiennk/Documents/introduction/admin-ui/src/app/(dashboard)/components/overview-dashboard-container.tsx)

**Chi tiết:**
1. Gọi `GET /admin/stats/overview` thay cho hardcoded `'1,248'`, `'312'`, `'5'`.
2. Gọi `GET /admin/stats/recent-bookings` thay cho `mockRecentBookings`.
3. Giữ nguyên Platform Revenue đã gọi API thật.

---

### Task 3.3 — BE: Cancellation Override API

**File cần tạo:**
- [NEW] `server/src/modules/bookings/application/use-cases/admin-override-cancellation.usecase.ts`

**File cần sửa:**
- [MODIFY] `admin-bookings.controller.ts` (tạo ở Phase 1) — thêm endpoint

**Chi tiết:**
1. `POST /admin/bookings/:bookingId/override-cancellation` — `@Authorize('admin')`.
2. Request body: `{ overrideReason: string, guestRefundCents: number, hostPayoutCents: number, platformFeeKeptCents: number }`.
3. Use case:
   - Tìm booking → validate đã cancelled.
   - Update row trong `cancellations`: set `override_reason`, `override_by_admin_id`, `platform_fee_kept_cents`.
   - **Không tạo ledger transaction mới** — chỉ ghi nhận override metadata.

**Tham chiếu:** Schema columns trong bảng `cancellations`: `override_reason`, `override_by_admin_id` (xem [schema.prisma L123-L148](file:///home/thiennk/Documents/introduction/server/prisma/schema.prisma#L123-L148)).

---

### Task 3.4 — BE: Host Penalties CRUD API

**File cần tạo:**
- [NEW] `server/src/modules/bookings/application/use-cases/manage-host-penalties.usecase.ts`

**File cần sửa:**
- [MODIFY] `admin-bookings.controller.ts` — thêm endpoints

**Chi tiết:**
1. Endpoints:
   - `GET /admin/penalties` — `@Authorize('admin')` — list all penalties (filter: hostId, page, limit).
   - `POST /admin/penalties` — `@Authorize('admin')` — create penalty `{ hostId, bookingId?, penaltyType, amountCents, notes }`.
   - `DELETE /admin/penalties/:id` — `@Authorize('admin')` — soft delete / remove penalty.
2. Host penalties là **bản ghi ghi nợ**, không trigger refund hay ledger transaction.

**Tham chiếu:** Schema bảng `host_penalties` (xem [schema.prisma L150-L160](file:///home/thiennk/Documents/introduction/server/prisma/schema.prisma#L150-L160)).

---

### Task 3.5 — BE: Superhost Toggle API

**File cần tạo:**
- [NEW] `server/src/modules/host-profile/application/use-cases/toggle-superhost.usecase.ts`

**File cần sửa:**
- [MODIFY] hoặc tạo mới controller admin cho host-profile

**Chi tiết:**
1. `PATCH /admin/hosts/:accountId/superhost` — `@Authorize('admin')` — toggle `is_superhost` boolean.
2. `GET /admin/hosts` — `@Authorize('admin')` — list hosts với `response_rate_pct`, `is_superhost` status.

**Tham chiếu:** Schema bảng `host_profiles` (xem [schema.prisma L163-L181](file:///home/thiennk/Documents/introduction/server/prisma/schema.prisma#L163-L181)).

---

### Task 3.6 — FE: Cancellation Overrides UI

**File cần sửa:**
- [MODIFY] bookings detail modal/page (tạo ở Phase 1) — thêm section "Override Cancellation"

**Chi tiết:**
1. Khi xem detail booking đã cancelled, hiển thị form override: reason, refund amounts.
2. Hiển thị override history nếu đã có.

---

### Task 3.7 — FE: Host Penalties UI

**File cần tạo:**
- [NEW] `admin-ui/src/features/penalties/` (types, services, hooks, components)

**File cần sửa:**
- [MODIFY] page `/users` hoặc tạo riêng page `/penalties`

**Chi tiết:**
1. Bảng penalties: Host, Booking, Type, Amount, Notes, Date.
2. Dialog tạo penalty mới.

---

### Task 3.8 — FE: Superhost Toggle UI

**File cần sửa:**
- [MODIFY] users table hoặc tạo tab "Hosts" riêng trong `/users` page

**Chi tiết:**
1. Hiển thị badge Superhost bên cạnh host users.
2. Toggle switch để bật/tắt superhost status.

---

### Task 3.9 — BE: Admin List Cancellations API

**File cần sửa:**
- [MODIFY] `admin-bookings.controller.ts`

**Chi tiết:**
1. `GET /admin/cancellations` — `@Authorize('admin')` — list all cancelled bookings + cancellation metadata (override info, applied policy, refund/payout amounts).
2. Cần join `cancellations` table với `bookings`.

---

### Task 3.10 — FE: Cancellations Tab trong Bookings page

**File cần sửa:**
- [MODIFY] `/bookings` page — thêm tab "Cancellations"

**Chi tiết:**
1. Bảng cancellations: Booking, Cancelled By, Policy Applied, Guest Refund, Host Payout, Override (Y/N), Date.
2. Click vào row → xem chi tiết + option override.

**Xác minh Phase 3:**
```bash
cd server && npm run lint
cd admin-ui && npm run build
```
Dashboard hiển thị KPI thật, `/bookings` có tab Cancellations + Override, penalties CRUD hoạt động, superhost toggle hoạt động.

---

## Thứ tự thực hiện gợi ý

```
Phase 0: Task 0.1 → 0.2
    ↓
Phase 1: Task 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
    ↓                          ↓
Phase 2: Task 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7
    ↓
Phase 3: Task 3.1 → 3.2 (dashboard)
         Task 3.3 → 3.6 (cancellation overrides)
         Task 3.4 → 3.7 (penalties)
         Task 3.5 → 3.8 (superhost)
         Task 3.9 → 3.10 (cancellations list)
```

> [!TIP]
> Trong Phase 3, các nhóm task (dashboard, cancellations, penalties, superhost) **có thể chạy song song** vì không phụ thuộc nhau.

---

## Hướng dẫn bàn giao cho AI Agent

Khi giao từng task cho agent, kèm theo:

1. **Module và layer đích** — ví dụ: `server/src/modules/bookings/`, Application → Use Case.
2. **File tham chiếu mẫu** — mỗi task đã ghi rõ ở trên.
3. **Tuân thủ Clean Architecture**: Use case viết bước đánh số `// 1.`, `// 2.`...
4. **Lưu ý kỹ thuật**:
   - Dùng `@Authorize('admin')` (import từ `shared/decorators/authorize.decorator`) — **không dùng** `@UseGuards(JwtAuthGuard)` + if-check role.
   - BigInt fields (amountCents) phải map sang `string` trong response DTO.
   - Admin-ui dùng `localStorage.getItem('rentify_admin_token')` — khác với client.
5. **Xác minh**: Chạy `npm run lint` (server), `npm run build` (admin-ui) trước khi báo hoàn tất.
