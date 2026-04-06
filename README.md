# Smart Attendance - HDBank

Hệ thống chấm công thông minh cho HDBank, hỗ trợ check-in/out qua WiFi BSSID và GPS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + Fastify + TypeORM |
| Web | Vite + React + TypeScript + Tailwind CSS |
| Mobile | React Native CLI (iOS/Android) |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| Shared | TypeScript monorepo (types, Zod schemas) |

## Project Structure

```
apps/
  api/        # NestJS backend
  web/        # React SPA (Vite)
  mobile/     # React Native app
packages/
  shared/     # Shared types, validation, constants
deploy/
  api/        # Dockerfile cho API
  web/        # Dockerfile + nginx config cho Web
```

## Quick Start

### 1. Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Xcode (cho iOS) hoặc Android Studio (cho Android)
- CocoaPods (`gem install cocoapods`)

### 2. Install dependencies

```bash
npm install
```

### 3. Start Database & Redis

```bash
# Dev mode: chỉ chạy DB + Redis trong Docker, API/Web chạy local
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Run Migration & Seed

```bash
cd apps/api
npm run migration:run
npm run seed
```

### 5. Start API

```bash
cd apps/api
npm run start:dev
```

API chạy tại `http://localhost:3000`

### 6. Start Web

```bash
cd apps/web
npm run dev
```

Web chạy tại `http://localhost:5173`

### 7. Start Mobile

```bash
cd apps/mobile

# Terminal 1 - Metro bundler
npm run start

# Terminal 2 - iOS
npm run ios

# Terminal 2 - Android
npm run android
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hdbank.com.vn` | `123456` |
| Manager | `manager@hdbank.com.vn` | `123456` |
| Employee | `nhanvien01@hdbank.com.vn` | `123456` |
| Employee | `nhanvien02@hdbank.com.vn` | `123456` |
| Employee | `nhanvien03@hdbank.com.vn` | `123456` |
| Employee | `giaodich01@hdbank.com.vn` | `123456` |

## Full Stack (Docker)

```bash
docker compose up --build
```

Chạy tất cả services: PostgreSQL + Redis + API + Web.

- Web: `http://localhost`
- API: `http://localhost:3000`
