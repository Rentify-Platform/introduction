# Hướng Dẫn Cài Đặt

Có 2 cách chạy Rentify Platform:

- **[Cách 1: Docker Compose](#cách-1-docker-compose-khuyến-nghị)** — Chạy toàn bộ hệ thống bằng 1 lệnh duy nhất. Phù hợp khi muốn demo nhanh hoặc deploy.
- **[Cách 2: Chạy thuần (Manual)](#cách-2-chạy-thuần-manual)** — Chạy từng service riêng. Phù hợp khi đang phát triển, cần hot-reload và debug.

> **Cả 2 cách đều cần setup biến môi trường trước.** Xem phần [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường) bên dưới.

---

## Cấu Hình Biến Môi Trường

### Server (`server/.env`)

```bash
# ── Database ──
DATABASE_URL=postgresql://rentify:rentify@localhost:5432/rentify?schema=public

# ── Redis ──
REDIS_URL=redis://localhost:6379

# ── Meilisearch ──
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=rentify_master_key_123456

# ── Auth ──
JWT_SECRET=               # Secret key cho JWT token (bắt buộc thay đổi khi deploy)

# ── Encryption ──
ENCRYPTION_KEY=           # Key mã hoá dữ liệu nhạy cảm (phải đủ 32 bytes)

# ── SePay (Thanh toán) ──
SEPAY_API_TOKEN=          # API token từ SePay
SEPAY_BANK_ACCOUNT_ID=    # ID tài khoản ngân hàng trên SePay
SEPAY_BANK_SLUG=          # Slug ngân hàng (vd: bidv, vietcombank)
SEPAY_WEBHOOK_TOKEN=      # Token xác thực webhook từ SePay

# ── Server ──
PORT=8080
```

### Client (`client/.env`)

```bash
# ── API ──
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080

# ── Mapbox (Bản đồ) ──
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=    # Access token từ Mapbox

# ── Cloudinary (Upload ảnh) ──
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=  # Cloud name từ Cloudinary
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET= # Upload preset (unsigned)

# ── SePay (Hiển thị thông tin chuyển khoản) ──
NEXT_PUBLIC_SEPAY_BANK_NAME=       # Tên ngân hàng (vd: BIDV)
NEXT_PUBLIC_SEPAY_BANK_ACCOUNT=    # Số tài khoản ngân hàng
NEXT_PUBLIC_SEPAY_ACCOUNT_HOLDER=  # Tên chủ tài khoản
```

### Admin (`admin-ui/.env`)

```bash
# ── API ──
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

> **Lưu ý:** Khi chạy bằng Docker Compose, các biến `DATABASE_URL`, `REDIS_URL`, `MEILI_HOST`, `MEILI_MASTER_KEY`, `PORT` đã được cấu hình sẵn trong `docker-compose.yml`. Chỉ cần tạo `server/.env` cho các biến còn lại (JWT, SePay, Encryption).

---

## Cách 1: Docker Compose (Khuyến nghị)

Docker Compose khởi động toàn bộ: PostgreSQL, Redis, Meilisearch, Server (NestJS), và Client (Next.js).

### Yêu cầu

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Khởi chạy

```bash
# 1. Clone repository
git clone <repository-url>
cd rentify

# 2. Khởi động toàn bộ hệ thống
docker-compose up -d

# 3. Seed dữ liệu mẫu (chạy lần đầu)
docker exec -it rentify-server npx prisma db seed
```

### Kết quả

| Service | URL | Mô tả |
| :--- | :--- | :--- |
| Client | http://localhost:3000 | Giao diện người dùng |
| Server API | http://localhost:8080 | Backend API |
| Meilisearch | http://localhost:7700 | Search engine dashboard |
| PostgreSQL | localhost:5432 | Database (user: `rentify`, pass: `rentify`) |
| Redis | localhost:6379 | Cache |

### Quản lý

```bash
# Xem logs
docker-compose logs -f server
docker-compose logs -f client

# Dừng toàn bộ
docker-compose down

# Dừng và xoá dữ liệu (reset database)
docker-compose down -v
```

---

## Cách 2: Chạy Thuần (Manual)

Chạy infrastructure (PostgreSQL, Redis, Meilisearch) bằng Docker, còn Server và Client chạy trực tiếp bằng Node.js — có hot-reload, phù hợp khi phát triển.

### Yêu cầu

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18+)
- Git

### Bước 1 — Khởi động infrastructure

Chỉ chạy PostgreSQL, Redis, Meilisearch:

```bash
docker-compose up -d postgres redis meilisearch
```

### Bước 2 — Cài đặt dependencies

```bash
# Backend
cd server
npm install

# Client
cd ../client
npm install

# Admin (nếu cần)
cd ../admin-ui
npm install
```

### Bước 3 — Setup database

```bash
cd server
npx prisma migrate dev
npm run seed
```

### Bước 4 — Chạy development

Mỗi service chạy trong một terminal riêng:

```bash
# Terminal 1 — Backend (watch mode, hot-reload)
cd server
npm run dev

# Terminal 2 — Client (Turbopack, hot-reload)
cd client
npm run dev

# Terminal 3 — Admin (nếu cần)
cd admin-ui
npm run dev
```

### Kết quả

| Service | URL |
| :--- | :--- |
| Client | http://localhost:3000 |
| Server API | http://localhost:8080 |
| Admin | http://localhost:3001 (hoặc port do Next.js chọn) |

---

## Tài Khoản Test

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| Admin | `admin@rentify.com` | `admin123` |
| Host (KYC verified) | `host@rentify.com` | `host123` |
| Guest | `guest@rentify.com` | `guest123` |

---

## Lệnh Thường Dùng

### Backend (server/)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Chạy dev server (watch mode) |
| `npm run build` | Build production |
| `npm run test` | Chạy tests |
| `npm run lint` | Kiểm tra linting |
| `npm run format` | Format code với Prettier |

### Client (client/)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Chạy dev server (Turbopack) |
| `npm run build` | Build production |
| `npm run lint` | Kiểm tra linting |
| `npm run format` | Format code với Prettier |
