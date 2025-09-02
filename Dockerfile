# Saegim Frontend (Next.js 15) - Multi-stage

# ---- Stage 1: deps ----
  FROM node:20-alpine AS deps
  WORKDIR /app
  RUN apk add --no-cache libc6-compat
  COPY package.json package-lock.json* ./
  RUN npm ci
  
  # ---- Stage 2: builder ----
  FROM node:20-alpine AS builder
  WORKDIR /app
  
  # 빌드 인자 (Jenkins에서 전달)
  ARG NEXT_PUBLIC_API_BASE_URL
  ARG GOOGLE_REDIRECT_URI
  ARG NEXT_PUBLIC_FIREBASE_API_KEY
  ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ARG NEXT_PUBLIC_FIREBASE_APP_ID
  ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY
  
  # 유틸
  RUN apk add --no-cache dumb-init curl
  
  # 의존성/소스
  COPY --from=deps /app/node_modules ./node_modules
  COPY package.json package-lock.json* ./
  COPY . .
  
  # 빌드 전에 코드 포맷 & ESLint 자동 수정
  ENV NEXT_TELEMETRY_DISABLED=1
  # 1) Prettier 자동 포맷 (scripts 존재 시 우선)
  RUN npm run format:fix || npx --yes prettier --write --ignore-unknown .
  # 2) ESLint 자동 수정 (가능한 범위)
  RUN npm run lint:fix || npm run lint -- --fix || true
  # 3) Next 실제 빌드
  RUN npm run build
  
  # ---- Stage 3: runner ----
  FROM node:20-alpine AS runner
  WORKDIR /app
  RUN apk add --no-cache dumb-init curl
  
  # node 유저는 base image에 이미 존재 → 재생성 금지
  RUN mkdir -p /app && chown -R node:node /app
  
  # 배포 산출물/필요 파일만 복사
  COPY --from=builder --chown=node:node /app/.next ./.next
  COPY --from=builder --chown=node:node /app/public ./public
  COPY --from=builder --chown=node:node /app/package.json ./package.json
  COPY --from=builder --chown=node:node /app/node_modules ./node_modules
  # next.config.(js|mjs|ts) 중 하나를 복사
  COPY --from=builder --chown=node:node /app/next.config.* ./
  
  ENV NODE_ENV=production
  USER node
  
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
  
  ENTRYPOINT ["dumb-init", "--"]
  CMD ["npm", "start"]
  