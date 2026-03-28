# 📝 PROMPT_LOG.md - AI Collaboration Journey

> **Project:** Smart Attendance (100 Branches - 10,000 Staffs)
> **AI Tooling:** Claude Opus 4.6 / Cursor / Claude Code

## 🌊 Phase 1: Architecture & Foundation
### Prompt 1: System Design
- **Input:** "Dựa trên yêu cầu bài toán Smart Attendance, hãy thiết kế Clean Architecture cho Backend bằng Go và Database Schema hỗ trợ Multi-branch, đảm bảo scale được cho 5.000 nhân viên."
- **Output:** AI đề xuất cấu trúc folder `/internal`, `/pkg` và Schema SQL có Indexing cho `branch_id` và `user_id`.
- **Result:** Đạt 100% cấu trúc dự án bền vững.

---

## 🛰 Phase 2: Core Logic (Anti-Cheat Check-in)
### Prompt 2: GPS & WiFi Validation
- **Input:** "Viết Service xử lý Check-in. Input gồm (lat, long, BSSID). Logic: Nếu BSSID thuộc chi nhánh thì OK, nếu không thì dùng công thức Haversine để check khoảng cách < 50m. Luôn trả về khoảng cách thực tế để Frontend hiển thị."
- **Output:** Hàm `ValidateLocation` sử dụng toán học chính xác.
- **Refinement:** Yêu cầu AI bổ sung `Redis Cache` để lưu danh sách BSSID hợp lệ của từng chi nhánh nhằm giảm tải cho DB khi 5.000 người check-in cùng lúc.

---

## 📊 Phase 3: Dashboard & Analytics
### Prompt 3: Aggregation Query
- **Input:** "Viết một SQL query tối ưu (hoặc GORM) để thống kê tỷ lệ đi muộn, về sớm theo từng phòng ban trong tháng hiện tại. Cần hỗ trợ phân trang và filter theo chi nhánh."
- **Output:** Query sử dụng `GROUP BY` và `JOIN` hiệu quả, có tính toán `OVERTIME` tự động.

---

## 🛠 Phase 4: DevOps & Deployment
### Prompt 4: Dockerization
- **Input:** "Tạo Dockerfile multi-stage cho Go Backend để tối ưu dung lượng image và file docker-compose.yml chạy kèm Postgres, Redis."
- **Output:** Image cuối cùng chỉ nặng ~20MB, setup 1-click là chạy toàn bộ hệ thống.

---

## 📱 Phase 5: Frontend & Mobile Tech Decision
### Prompt 5: Mobile Framework Selection
- **Input:** "Mobile React Native hay Flutter okie hơn?"
- **Output:** Chọn **React Native** vì shared ecosystem với Web (React + TypeScript), code sharing types/validation/API client, NativeWind (Tailwind cho RN), lucide-react-native có sẵn.
- **Reasoning:** App chấm công không cần animation nặng nên RN performance đủ dùng. Team đã dùng React nên zero learning curve.

### Prompt 6: Web Framework Migration
- **Input:** "Tại sao dùng Next.js mà không dùng Vite client side?"
- **Output:** Quyết định chuyển từ **Next.js sang Vite + React SPA** vì:
  - App chấm công là internal tool, không cần SSR/SEO.
  - Backend Go đã handle hết logic, Next.js API routes = thừa layer.
  - Deploy đơn giản hơn (static files + Nginx vs Node server).
  - Docker image nhẹ hơn, build nhanh hơn.
- **Result:** Tech stack frontend cập nhật: Vite + React + TypeScript + Tailwind CSS + React Router.

### Prompt 7: Backend Framework Migration
- **Input:** "Tại sao dùng Golang mà không dùng NestJS?"
- **Output:** Quyết định chuyển từ **Go (Gin) sang NestJS (TypeScript)** vì:
  - **Full-stack TypeScript monorepo:** Web (Vite React) + Mobile (React Native) + Backend (NestJS) cùng 1 ngôn ngữ. Share types, Zod schemas, API contracts.
  - **Team efficiency:** 1 developer nhảy giữa FE/BE/Mobile không cần switch ngôn ngữ.
  - **Scale 10,000 nhân viên:** Peak load ~4.5 req/s — NestJS + Fastify handle ~10,000 req/s dễ dàng. Bottleneck ở DB, không phải framework.
  - **Clean Architecture built-in:** NestJS có Module/Service/Repository pattern sẵn.
  - **Dev speed:** Decorators, DI, auto-validation nhanh hơn Go boilerplate.
- **Trade-off accepted:** Docker image nặng hơn (~200MB vs ~20MB Go), nhưng xứng đáng cho developer experience.

---

## 💡 Lessons Learned & AI Optimization
1. **Context is King:** Việc cung cấp file `CLAUDE.md` giúp AI không bao giờ viết code sai convention của dự án.
2. **Reviewing:** Mọi đoạn code AI sinh ra đều được review qua 2 bước: 
   - Kiểm tra Logic bảo mật (RBAC).
   - Kiểm tra hiệu năng (N+1 query).