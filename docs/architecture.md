# Kiến Trúc Hệ Thống

Tài liệu mô tả kiến trúc tổng thể, cấu trúc module, và thiết kế database của Rentify Platform.

---

## Clean Architecture

Backend tuân thủ nghiêm ngặt **Clean Architecture** với 4 layer tách biệt:

```
┌──────────────────────────────────────────┐
│           Presentation Layer             │
│   Controllers, DTOs, Guards, Pipes       │
├──────────────────────────────────────────┤
│           Application Layer              │
│   Use Cases, Repository Interfaces       │
├──────────────────────────────────────────┤
│             Domain Layer                 │
│   Entities, Value Objects, Enums         │
├──────────────────────────────────────────┤
│          Infrastructure Layer            │
│   Prisma Repositories, External APIs     │
└──────────────────────────────────────────┘
```

### Nguyên tắc

- **Dependency Inversion**: Repository interfaces định nghĩa trong Application/Domain, implementation trong Infrastructure
- **Use Case Pattern**: Mỗi business operation là một Use Case class riêng biệt, đánh số bước rõ ràng (`// 1.`, `// 2.`, ...) để dễ maintain
- **Domain Isolation**: Entity không phụ thuộc vào framework hay database

---

## Cấu Trúc Module

```
server/src/
├── modules/
│   ├── auth/           # Xác thực, đăng ký, đăng nhập
│   ├── bookings/       # Đặt phòng, quản lý booking lifecycle
│   ├── host-profile/   # Hồ sơ chủ nhà, Superhost
│   ├── kyc/            # Xác minh danh tính (KYC)
│   ├── ledger/         # Sổ cái kép, giao dịch tài chính
│   ├── listings/       # Quản lý bất động sản, ảnh, tiện ích
│   ├── search/         # Tìm kiếm qua Meilisearch
│   └── wishlist/       # Danh sách yêu thích
├── shared/             # Utilities, decorators, guards dùng chung
└── prisma/             # Prisma service, migrations
```

---

## Thiết Kế Database

### Tổng quan quan hệ

```
accounts ──┬── profiles (1:1)
            ├── host_profiles (1:1)
            ├── properties (1:N) ──┬── property_photos (1:N)
            │                      ├── property_amenities (M:N → amenities)
            │                      ├── property_calendar (1:N)
            │                      ├── property_licenses (1:N)
            │                      └── bookings (1:N)
            ├── bookings (1:N as guest) ──┬── payments (1:N)
            │                              ├── reviews (1:N)
            │                              ├── cancellations (1:N)
            │                              └── ledger_transactions (1:N)
            ├── wishlists (1:N) ── wishlist_items (M:N → properties)
            ├── kyc_documents (1:N)
            ├── kyc_checks (1:N)
            ├── ledger_accounts (1:N) ── ledger_entries (1:N)
            └── payment_methods (1:N)
```

### Quyết định thiết kế quan trọng

#### 1. Sổ cái kép (Double-Entry Ledger)

Hệ thống tài chính sử dụng mô hình **sổ cái kép** chuẩn kế toán:

- **`ledger_accounts`**: tài khoản sổ cái cho mỗi bên (platform, host, guest, tax_authority)
- **`ledger_transactions`**: giao dịch với idempotency key ngăn duplicate
- **`ledger_entries`**: mỗi giao dịch ghi ít nhất 2 bút toán (debit + credit), tổng = 0

Mô hình này đảm bảo:
- Mọi dòng tiền đều truy vết được
- Không mất tiền do bug phần mềm
- Hỗ trợ hoàn tiền, chi trả, phí dịch vụ — tất cả qua cùng cơ chế

#### 2. Chính sách huỷ nhiều mức (Multi-Tier Cancellation)

```
cancellation_policies (1:N) → cancellation_policy_tiers
```

Mỗi chính sách có nhiều tier, mỗi tier quy định:
- Số ngày trước check-in
- Phần trăm hoàn tiền cho khách
- Phần trăm chi trả cho chủ nhà
- Có hoàn phí dọn dẹp / phí dịch vụ / thuế hay không

Hệ thống tự động chọn tier phù hợp dựa trên thời điểm huỷ.

#### 3. Ngăn đặt phòng trùng ngày

Sử dụng **PostgreSQL `daterange`** với **exclusion constraints** ở mức database — đảm bảo không bao giờ xảy ra 2 booking trùng ngày cho cùng 1 property, kể cả khi có race condition.

#### 4. KYC đa lớp

```
kyc_documents → kyc_checks (identity_document, facial_match, background_check, ...)
```

Hệ thống xác minh gồm nhiều loại kiểm tra, mỗi check có score và thời hạn — hỗ trợ cả guest KYC và host KYC.

#### 5. Outbox Pattern

```
outbox_events (aggregate_type, event_type, payload, status, attempts)
```

Sử dụng **Transactional Outbox Pattern** để đảm bảo event publishing tin cậy — tránh mất event khi database commit thành công nhưng message broker fail.

---

## Roles & Quyền

| Role | Mô tả |
| :--- | :--- |
| `guest` | Khách thuê — tìm kiếm, đặt phòng, đánh giá, thanh toán |
| `host` | Chủ nhà — đăng tin, quản lý property, nhận thanh toán |
| `admin` | Quản trị — duyệt KYC, quản lý cancellations, xem ledger |

---

## Containerization

Toàn bộ hệ thống chạy qua **docker-compose** với các service:
- `server` — NestJS backend
- `client` — Next.js client
- `admin-ui` — Next.js admin dashboard
- `postgres` — PostgreSQL database
- `redis` — Redis cache
- `meilisearch` — Search engine
