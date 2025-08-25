# 개발 환경 설정

새김 프론트엔드 프로젝트의 개발 환경을 설정하는 방법을 안내합니다.

## 시스템 요구사항

- **Node.js**: 18.17 이상
- **npm**: 9.0 이상
- **Git**: 2.0 이상

## 설치 과정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd saegim-frontend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# API 설정
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. 개발 서버 시작

```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 개발 스크립트

```bash
# 개발 서버 시작 (Webpack 모드)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 린팅
npm run lint
npm run lint:fix

# 포맷팅
npm run format
npm run format:fix

# 종속성 재설치 (문제 해결 시)
npm run clean:install
```

## IDE 설정

### VS Code 추천 확장

- TypeScript Importer
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Git Lens

### 설정 파일

프로젝트에는 다음 설정 파일들이 포함되어 있습니다:

- `.editorconfig`: 에디터 설정
- `.prettierrc.mjs`: 코드 포맷팅 규칙
- `eslint.config.mjs`: 린팅 규칙
- `tsconfig.json`: TypeScript 설정

## 다음 단계

설정이 완료되면 다음 문서들을 참고하세요:

- [Firebase Cloud Messaging 설정](./fcm.md)
- [빌드 구성](./build.md)
- [프로젝트 구조](./structure.md)
