# Saegim Frontend (Next.js 15) - Multi-stage
# ===========================================

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
  
  # 런타임 유틸
  RUN apk add --no-cache dumb-init curl
  
  # 의존성 복사
  COPY --from=deps /app/node_modules ./node_modules
  COPY package.json package-lock.json* ./
  # 앱 소스 복사
  COPY . .
  
  # 빌드(환경변수는 빌드타임에 주입)
  ENV NEXT_TELEMETRY_DISABLED=1
  RUN npm run build
  
  # ---- Stage 3: runner ----
  FROM node:20-alpine AS runner
  WORKDIR /app
  RUN apk add --no-cache dumb-init curl
  
  # node 유저는 base image에 이미 존재 (재생성 금지)
  # 소유권만 정돈
  RUN mkdir -p /app && chown -R node:node /app
  
  # 앱 배포 산출물만 복사
  COPY --from=builder --chown=node:node /app/.next ./.next
  COPY --from=builder --chown=node:node /app/public ./public
  COPY --from=builder --chown=node:node /app/package.json ./package.json
  COPY --from=builder --chown=node:node /app/node_modules ./node_modules
  # (필요 시) next.config.js 등 설정파일 복사
  COPY --from=builder --chown=node:node /app/next.config.js ./next.config.js
  
  ENV NODE_ENV=production
  USER node
  
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
  
  ENTRYPOINT ["dumb-init", "--"]
  CMD ["npm", "start"]
  