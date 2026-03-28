# Smart Attendance Project Guide

## 📌 Project Overview
Hệ thống chấm công thông minh quy mô 100 chi nhánh, 10.000 nhân viên.
- **Core features:** Check-in/out (WiFi/GPS), Branch Management, Dashboard, RBAC.
- **Scale Strategy:** Database Indexing, API Pagination, Redis Caching, Connection Pooling.

## 🛠 Tech Stack
- **Backend:** NestJS (TypeScript) + Fastify adapter.
- **Web Frontend:** Vite + React + TypeScript + Tailwind CSS + Lucide Icons.
- **Mobile:** React Native (shared ecosystem với Web).
- **Shared:** TypeScript monorepo — shared types, validation (Zod), API contracts giữa BE/Web/Mobile.
- **Database:** PostgreSQL (Primary), Redis (Attendance Cache).
- **DevOps:** Docker, docker-compose (multi-stage build).

## 📁 Project Structure
- `/apps/api`: NestJS backend (Modules, Controllers, Services, Repositories).
- `/apps/web`: Vite + React SPA frontend.
- `/apps/mobile`: React Native mobile app.
- `/packages/shared`: Shared types, validation schemas, constants.
- `/deploy`: Dockerfiles và cấu hình môi trường.

## 📏 Coding Conventions
- **Naming:** camelCase cho variables/functions, PascalCase cho classes/interfaces/types.
- **Architecture:** Clean Architecture (Controller -> Service -> Repository) via NestJS Modules.
- **Error Handling:** Sử dụng NestJS Exception Filters, custom HttpException classes.
- **Validation:** Class-validator + Zod schemas (shared với FE).
- **Git:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).

## 🚀 Build & Run Commands
- **Backend:** `npm run start:dev` (trong thư mục /apps/api)
- **Frontend:** `npm run dev` (trong thư mục /apps/web)
- **Full Stack (Docker):** `docker-compose up --build`
- **Tests:** `npm test` (từng app) | `npm run test:e2e`

## 🛡 Anti-Cheat Logic (Critical)
- **Check-in validation:** Bắt buộc khớp `BSSID` (WiFi) OR nằm trong bán kính `50m` của tọa độ Chi nhánh (GPS).
- **Security:** Không tin tưởng hoàn toàn vào Client, thực hiện kiểm tra khoảng cách phía Server.
- **Logging:** Mọi hành động check-in phải ghi lại `User-Agent` và `Device-ID`.

## 🤖 AI Instructions (For Claude/Cursor)
- Luôn tạo **API Pagination** cho các endpoint danh sách (Nhân viên, Lịch sử).
- Khi generate migration, sử dụng kiểu dữ liệu `GEOGRAPHY(POINT)` cho tọa độ.
- Luôn kiểm tra quyền (RBAC) trước khi thực hiện các hàm `CRUD` chi nhánh.
- File log làm việc với AI: `PROMPT_LOG.md`.