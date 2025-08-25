# 보안 고려사항

새김 프로젝트의 보안 관련 설정과 베스트 프랙티스를 안내합니다.

## 환경변수 관리

### 원칙

1. **민감한 정보는 절대 소스코드에 하드코딩하지 않음**
2. **클라이언트 노출 가능한 변수만 `NEXT_PUBLIC_` 접두사 사용**
3. **환경별로 적절한 값 설정**

### 파일 구조

```text
📁 프로젝트 루트/
├── 📄 .env.example          ✅ Git 관리 (예시 파일)
├── 📄 .env.local.example    ✅ Git 관리 (예시 파일)
├── 📄 .env.development      ✅ Git 관리 (개발 환경 기본값)
├── 📄 .env.production       ✅ Git 관리 (프로덕션 환경 기본값)
├── 📄 .env.local            ❌ Git 무시 (로컬 개발용)
└── 📄 .env.development.local ❌ Git 무시 (로컬 개발 오버라이드)
```

### 환경변수 분류

#### 클라이언트 노출 가능 (`NEXT_PUBLIC_`)

```env
# Firebase 설정 (클라이언트에서 필요)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API 엔드포인트
NEXT_PUBLIC_API_BASE_URL=https://api.saegim.com
```

#### 서버 전용 (접두사 없음)

```env
# 데이터베이스 연결 (서버에서만 사용)
DATABASE_URL=postgresql://...

# 외부 API 시크릿 키 (서버에서만 사용)
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_API_KEY=...
```

## Service Worker 보안

### 템플릿 시스템의 보안 이점

1. **소스코드 분리**: 민감한 설정값이 Git 히스토리에 남지 않음
2. **빌드 시점 주입**: 환경별로 다른 설정 적용 가능
3. **접근 제한**: 생성된 파일은 `.gitignore`로 추적 제외

### 구현 방식

```javascript
// 템플릿 파일 (firebase-messaging-sw.template.js)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... 다른 설정들
};

// 빌드 시점에 실제 값으로 치환됨
const firebaseConfig = {
  apiKey: 'actual_api_key_value',
  authDomain: 'actual_auth_domain',
  // ... 실제 값들
};
```

## 인증 보안

### Firebase Authentication

1. **도메인 제한**: Firebase 콘솔에서 허용된 도메인만 설정
2. **API 키 제한**: Firebase API 키에 적절한 제한 설정
3. **토큰 관리**: JWT 토큰의 안전한 저장 및 전송

### 세션 관리

```typescript
// 안전한 토큰 저장
localStorage.setItem('authToken', token); // 개발용
// 프로덕션에서는 httpOnly 쿠키 권장
```

## API 보안

### CORS 설정

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.NODE_ENV === 'production'
                ? 'https://saegim.com'
                : 'http://localhost:3000',
          },
        ],
      },
    ];
  },
};
```

### API 키 보호

1. **환경변수 사용**: 하드코딩 금지
2. **서버 사이드 프록시**: 민감한 API 호출은 서버에서 처리
3. **Rate Limiting**: API 호출 빈도 제한

## 데이터 보호

### 사용자 데이터

1. **최소 수집 원칙**: 필요한 데이터만 수집
2. **암호화**: 민감한 데이터는 암호화 저장
3. **익명화**: 분석 데이터는 개인 식별 정보 제거

### 로그 보안

```typescript
// 민감한 정보 로깅 금지
console.log('User logged in:', user.id); // ✅ 안전
console.log('User data:', user); // ❌ 위험 (전체 객체 노출)
```

## 배포 보안

### 환경 분리

1. **개발/스테이징/프로덕션 환경 분리**
2. **각 환경별 독립적인 Firebase 프로젝트**
3. **환경별 다른 API 엔드포인트**

### 빌드 보안

```bash
# 빌드 시 환경변수 체크
if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
  echo "Error: Firebase API key not set"
  exit 1
fi
```

## 모니터링

### 보안 이벤트 추적

1. **로그인/로그아웃 이벤트**
2. **비정상적인 API 호출 패턴**
3. **인증 실패 시도**

### 에러 보고

```typescript
// 민감한 정보 제외한 에러 보고
const sanitizedError = {
  message: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  // 사용자 데이터는 제외
};
```

## 체크리스트

### 개발 시

- [ ] 환경변수 사용 (하드코딩 금지)
- [ ] `.env.local` 파일 `.gitignore` 확인
- [ ] API 키 노출 여부 확인
- [ ] 사용자 데이터 로깅 방지

### 배포 시

- [ ] 프로덕션 환경변수 설정 확인
- [ ] Firebase 도메인 제한 설정
- [ ] HTTPS 강제 적용
- [ ] 에러 페이지에서 민감한 정보 노출 방지

## 관련 문서

- [Firebase Cloud Messaging 설정](./fcm.md)
- [빌드 구성](./build.md)
- [문제 해결](./troubleshooting.md)
