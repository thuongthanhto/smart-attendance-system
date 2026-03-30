# ====== Stage 1: Build ======
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN npm ci --workspace=@smart-attendance/shared --workspace=@smart-attendance/api

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared package first, then API
RUN npm run build -w packages/shared
RUN npm run build -w apps/api

# ====== Stage 2: Production ======
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files for production install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production deps only
RUN npm ci --workspace=@smart-attendance/shared --workspace=@smart-attendance/api --omit=dev

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy env example as fallback
COPY apps/api/.env.example ./apps/api/.env

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
