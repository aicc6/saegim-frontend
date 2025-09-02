# ============================================================================
# Saegim Frontend - Next.js 15 / Node 20 (Production, standalone)
# 공유 서버 규칙: host 포트 바인딩 금지. NPM에서 컨테이너명:3000으로 라우팅.
# 비밀(.env.local)은 이미지에 포함하지 않음 → Jenkins --env-file & --build-arg로 주입.
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

# 빌더에서도 필요 도구
RUN apk add --no-cache libc6-compat dumb-init curl

# node_modules 재사용
COPY --from=deps /app/node_modules ./node_modules

# 소스 복사
COPY . .

# 🔐 빌드 타임 공개 ENV (NEXT_PUBLIC_*, redirect 등)
ARG NEXT_PUBLIC_API_BASE_URL
ARG GOOGLE_REDIRECT_URI
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY

# Next.js 프리렌더가 읽을 수 있도록 ENV 승격
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV NEXT_PUBLIC_FIREBASE_VAPID_KEY=${NEXT_PUBLIC_FIREBASE_VAPID_KEY}

# (선택) 자동 포맷 — 실패해도 빌드 계속
RUN npx --yes prettier@3.3.3 --write "src/**/*.{ts,tsx,js,jsx}" && \
    npx --yes prettier@3.3.3 --write "*.{json,md,css}" || true

# Next.js 빌드 (standalone)
RUN npm run build

# 3) runner
FROM node:20-alpine AS runner
WORKDIR /app

# 런타임 필수 도구
RUN apk add --no-cache dumb-init curl

# 비루트 사용자
RUN addgroup -g 1001 nodegrp && adduser -D -u 1001 -G nodegrp node
USER node

# standalone 실행 산출물 복사
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["dumb-init", "node", "server.js"]
