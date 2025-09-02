# ============================================================================
# Saegim Frontend - Next.js 15 / Node 20 (Production, standalone)
# 공유 서버 안전성 고려: 포트 바인딩은 컨테이너 외부에서 하지 않습니다.
# Nginx Proxy Manager(NPM)에서 컨테이너명:3000 으로 라우팅하세요.
# ============================================================================

# -------------------------
# 1) deps: install deps
# -------------------------
  FROM node:20-alpine AS deps
  WORKDIR /app
  
  # alpine 필수 라이브러리
  RUN apk add --no-cache libc6-compat
  
  # 패키지 파일만 먼저 복사 (캐시 최적화)
  COPY package.json package-lock.json* ./
  
  # devDependencies 포함하여 설치 (빌드 필요)
  RUN npm ci
  
  # -------------------------
  # 2) builder: build app
  # -------------------------
  FROM node:20-alpine AS builder
  WORKDIR /app
  RUN apk add --no-cache libc6-compat
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # node_modules 준비
  COPY --from=deps /app/node_modules ./node_modules
  
  # 앱 소스 복사
  COPY . .
  
  # .env.local 파일은 빌드 시 필요(NEXT_PUBLIC_* 변수). 최종 이미지에는 포함되지 않습니다.
  # .dockerignore에서 .env.local이 제외되지 않도록 확인하세요.
  RUN npm run build
  
  # -------------------------
  # 3) runner: minimal runtime
  # -------------------------
  FROM node:20-alpine AS runner
  WORKDIR /app
  
  RUN apk add --no-cache libc6-compat dumb-init curl
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  ENV PORT=3000
  
  # 비루트 유저 (node 이미지에 내장)
  USER node
  
  # Next.js standalone 산출물 복사
  # - server.js가 루트에 위치하도록 복사
  COPY --chown=node:node --from=builder /app/public ./public
  COPY --chown=node:node --from=builder /app/.next/standalone ./
  COPY --chown=node:node --from=builder /app/.next/static ./.next/static
  
  EXPOSE 3000
  
  # 간단 헬스체크: 루트 200 여부
  HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
  
  CMD ["dumb-init", "node", "server.js"]
  