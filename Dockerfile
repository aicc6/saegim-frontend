# Saegim Frontend (Next.js 15) - Multi-stage, production-optimized
# - .env.local은 빌드 타임에만 사용(이미지 최종 단계에는 포함하지 않음)
# - runner에는 production dependencies만 포함

# ========= Stage 1: deps (install all deps incl. dev) =========
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# ========= Stage 2: builder (build with envs) =========
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time envs (Jenkins --build-arg 로 전달되는 값)
ARG NEXT_PUBLIC_API_BASE_URL
ARG GOOGLE_REDIRECT_URI
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY

# ARG → ENV 매핑 (Next build가 process.env로 읽을 수 있게)
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI} \
    NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY} \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID} \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET} \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID} \
    NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID} \
    NEXT_PUBLIC_FIREBASE_VAPID_KEY=${NEXT_PUBLIC_FIREBASE_VAPID_KEY} \
    NEXT_TELEMETRY_DISABLED=1

# Tools (optional)
RUN apk add --no-cache dumb-init curl

# deps + source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY . .

# 코드 포맷/린트(가능한 범위에서 자동 수정), 이후 빌드
RUN npm run format:fix || npx --yes prettier --write --ignore-unknown .
RUN npm run lint:fix || npm run lint -- --fix || true
RUN npm run build

# ========= Stage 3: prod-deps (production-only deps) =========
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
# 러너에 넣을 프로덕션 의존성만 설치
RUN npm ci --omit=dev

# ========= Stage 4: runner (minimal runtime image) =========
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init curl
RUN mkdir -p /app && chown -R node:node /app

# 빌드 산출물 & 런타임 필요 파일만 복사
COPY --from=builder   --chown=node:node /app/.next        ./.next
COPY --from=builder   --chown=node:node /app/public       ./public
COPY --from=builder   --chown=node:node /app/package.json ./package.json
COPY --from=builder   --chown=node:node /app/next.config.* ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# ✅ 런타임 TS 의존성 충족 (next.config.ts 실행 시 필요)
RUN npm install --no-save typescript @types/node

# 최종 이미지에는 .env.local을 포함하지 않음 (보안/일관성)
# Next.js는 빌드 시 env를 이미 인라인함

ENV NODE_ENV=production
USER node

EXPOSE 3000

# 헬스체크는 파이프라인(run 옵션)에서 설정(중복 방지)
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
