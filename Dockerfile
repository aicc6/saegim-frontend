# 새김(Saegim) 프론트엔드 Dockerfile
# Next.js 15 + TypeScript + Tailwind CSS

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps
LABEL stage=deps
LABEL description="Install dependencies"

# Alpine 패키지 업데이트 및 필수 도구 설치
RUN apk add --no-cache libc6-compat

# 작업 디렉터리 설정
WORKDIR /app

# 패키지 정보 복사
COPY package.json package-lock.json* ./

# 의존성 설치 (프로덕션 의존성만)
RUN npm ci --only=production && npm cache clean --force

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder
LABEL stage=builder
LABEL description="Build the application"

# Alpine 패키지 업데이트 및 필수 도구 설치
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# 개발 의존성 설치 (빌드에 필요)
RUN npm install

# 소스 코드 복사
COPY . .

# 환경변수 파일 복사
COPY .env* ./

# 환경변수 설정 (빌드 시점)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js 빌드
RUN npm run build

# =============================================================================
# Stage 3: Runner (최종 실행 이미지)
# =============================================================================
FROM node:20-alpine AS runner
LABEL stage=runner
LABEL maintainer="새김꾼들"
LABEL version="1.0.0"

# Alpine 패키지 업데이트
RUN apk add --no-cache \
  dumb-init \
  curl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

WORKDIR /app

# 환경변수 설정
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 프로덕션 의존성만 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js 빌드 결과물 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public 폴더 복사 (정적 파일)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 사용자 권한 설정
USER nextjs

# 포트 노출
EXPOSE 3000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 애플리케이션 실행
CMD ["dumb-init", "node", "server.js"]
