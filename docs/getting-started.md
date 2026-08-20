# Hướng Dẫn Cài Đặt

Có 2 cách chạy Rentify Platform:

- **[Cách 1: Docker Compose](#cách-1-docker-compose-khuyến-nghị)** — Chạy toàn bộ hệ thống bằng 1 lệnh duy nhất. Phù hợp khi muốn demo nhanh hoặc deploy.
- **[Cách 2: Chạy thuần (Manual)](#cách-2-chạy-thuần-manual)** — Chạy từng service riêng. Phù hợp khi đang phát triển, cần hot-reload và debug.

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
