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
# ⚠️ .env.local은 빌드 입력용만 사용 가능. 최종 이미지에 포함 금지(.dockerignore에 추가).
RUN npm run build

# 3) runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat dumb-init curl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
USER node
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["dumb-init", "node", "server.js"]
