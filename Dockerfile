# ============================================================================
# Saegim Frontend - Next.js 15 / Node 20 (Production, standalone)
# 공유 서버 규칙: host 포트 바인딩 금지. NPM에서 컨테이너명:3000으로 라우팅.
# 비밀(.env.local)은 이미지에 포함하지 않음 → Jenkins --env-file로 주입.
# ============================================================================

# 1) deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# 2) builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚡ 자동 포맷 (빌드 전에 코드 정리)
# - 리포지토리 파일을 포맷한 레이어를 생성한 뒤 바로 빌드
# - 사소한 포맷 오류로 빌드가 중단되지 않도록 || true 처리
RUN npx --yes prettier@3.3.3 --write "src/**/*.{ts,tsx,js,jsx}" \
 && npx --yes prettier@3.3.3 --write "*.{json,md,css}" || true

# ⚠️ .env.local은 빌드 입력용만 사용 가능. 최종 이미지에 포함 금지(.dockerignore에 추가).
RUN npm run build

# 3) runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init curl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 보안: 비루트 사용자
USER node

# standalone 실행 산출물 복사
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["dumb-init", "node", "server.js"]
