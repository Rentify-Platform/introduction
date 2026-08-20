# Tech Stack

Tổng quan công nghệ sử dụng trong Rentify Platform và lý do lựa chọn.

---

## Tổng Quan

| Thành phần | Công nghệ | Phiên bản |
| :--- | :--- | :---: |
| **Backend** | NestJS (TypeScript) | — |
| **Client Web** | Next.js (App Router, Turbopack) | 16.x |
| **Admin Dashboard** | Next.js | — |
| **Database** | PostgreSQL | — |
| **ORM** | Prisma | — |
| **Cache** | Redis | — |
| **Search Engine** | Meilisearch | — |
| **Styling** | Tailwind CSS v4 | — |
| **State Management** | Zustand | — |
| **Data Fetching** | TanStack Query v5 | — |
| **Forms & Validation** | React Hook Form + Zod | — |
| **Icons** | Lucide React | — |
| **Containerization** | Docker & docker-compose | — |

---

## Chi Tiết & Lý Do Lựa Chọn

### Backend — NestJS (TypeScript)

NestJS cung cấp kiến trúc module hóa mạnh, hỗ trợ dependency injection sẵn có, phù hợp với Clean Architecture mà dự án áp dụng. TypeScript đảm bảo type safety xuyên suốt từ API đến database layer.

### Database — PostgreSQL + Prisma

PostgreSQL hỗ trợ các tính năng nâng cao mà dự án cần:
- **`daterange`** với exclusion constraints — ngăn đặt phòng trùng ngày ở mức database
- **`citext`** — so sánh email case-insensitive
- **Partial indexes** — tối ưu query cho properties đang active
- **Check constraints** — đảm bảo tính toàn vẹn dữ liệu tài chính (booking amounts, ratings, percentages)

Prisma đóng vai trò ORM với type-safe query API và migration management.

### Search — Meilisearch

Meilisearch xử lý full-text search với tốc độ mili-giây, hỗ trợ typo tolerance và faceted filtering — phù hợp cho tìm kiếm bất động sản theo nhiều tiêu chí (vị trí, giá, tiện ích, loại phòng).

### Cache — Redis

Redis dùng cho session management, cache kết quả query thường xuyên, và rate limiting.

### Client — Next.js 16 (App Router)

Next.js App Router cho phép tận dụng Server Components để giảm JavaScript gửi về client, cải thiện SEO cho trang listing, và tối ưu performance với Turbopack.

### Styling — Tailwind CSS v4

Tailwind v4 kết hợp với hệ thống design variables tùy chỉnh theo phong cách Airbnb — đảm bảo giao diện nhất quán xuyên suốt ứng dụng.

### State & Data — Zustand + TanStack Query

- **Zustand**: quản lý client state nhẹ, đơn giản, không boilerplate
- **TanStack Query v5**: quản lý server state, cache, revalidation, và optimistic updates cho mutations (đặt phòng, thanh toán, đánh giá)

---

## Sơ Đồ Tổng Quan

```
┌─────────────┐    ┌──────────────┐
│  Client Web │    │  Admin UI    │
│  (Next.js)  │    │  (Next.js)   │
└──────┬──────┘    └──────┬───────┘
       │                  │
       └────────┬─────────┘
                │ REST API
        ┌───────▼────────┐
        │    NestJS      │
        │   (Backend)    │
        └──┬────┬────┬──┘
           │    │    │
    ┌──────┘    │    └──────┐
    │           │           │
┌───▼──────┐ ┌──▼──────┐ ┌──▼──────────┐
│PostgreSQL│ │  Redis  │ │ Meilisearch │
│(Database)│ │ (Cache) │ │  (Search)   │
└──────────┘ └─────────┘ └─────────────┘
```
