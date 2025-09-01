# 새김(Saegim) 프론트엔드 Dockerfile
# Next.js 15 + TypeScript + Tailwind CSS
# Multi-stage build: deps → builder → runner
# Jenkinsfile과 healthcheck 경로(/) 통일

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps
LABEL stage=deps
WORKDIR /app

# glibc 호환 레이어
RUN apk add --no-cache libc6-compat

# package 메타 복사
COPY package.json package-lock.json* ./

# 프로덕션 의존성 설치
ENV HUSKY=0
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder
LABEL stage=builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

# deps에서 설치된 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# devDependencies 설치 (빌드용)
ENV HUSKY=0
RUN npm install --ignore-scripts

# 전체 소스 복사
COPY . .

# Jenkins가 주입한 .env.local도 포함됨 (.dockerignore에서 주석 처리 필요)
# 별도 COPY .env* 불필요 → Jenkinsfile에서 관리

# 빌드 시 환경
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js 빌드 (standalone 모드 필요)
RUN npm run build

# =============================================================================
# Stage 3: Runner
# =============================================================================
FROM node:20-alpine AS runner
LABEL stage=runner maintainer="Saegim Team" version="1.0.0"
WORKDIR /app

# 런타임 유틸 + curl(헬스체크용) + 비루트 유저
RUN apk add --no-cache dumb-init curl ca-certificates \
  && addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs \
  && update-ca-certificates

# 실행 환경 변수
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 산출물 복사 (node_modules 포함됨)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 권한/포트/헬스체크
USER nextjs
EXPOSE 3000

# Jenkinsfile과 통일: healthcheck → /
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -fsS http://localhost:3000/ || exit 1

# 애플리케이션 실행
CMD ["dumb-init", "node", "server.js"]
