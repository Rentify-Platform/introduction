# Hướng Dẫn Cài Đặt

Hướng dẫn chạy Rentify Platform trên môi trường local.

---

## Yêu Cầu

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18+)
- Git

---

## Khởi Chạy Nhanh

### 1. Clone repository

```bash
git clone <repository-url>
cd rentify
```

### 2. Khởi chạy infrastructure với Docker

```bash
docker-compose up -d
```

Lệnh này khởi động: PostgreSQL, Redis, Meilisearch.

### 3. Cài đặt dependencies

```bash
# Backend
cd server
npm install

# Client
cd ../client
npm install

# Admin
cd ../admin-ui
npm install
```

### 4. Setup database

```bash
cd server
npx prisma migrate dev
npm run seed
```

### 5. Chạy development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev

# Terminal 3 — Admin
cd admin-ui
npm run dev
```

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
