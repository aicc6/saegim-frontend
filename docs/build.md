# 빌드 구성

새김 프론트엔드 프로젝트의 빌드 시스템과 구성에 대한 상세 가이드입니다.

## 빌드 시스템

### Webpack vs Turbopack

이 프로젝트는 **Webpack 모드**로 구성되어 있습니다:

- **이유**: Turbopack에서 발생하는 모듈 로딩 오류 회피
- **설정**: `next.config.ts`에서 Turbopack 설정 제거됨
- **성능**: Webpack 기반으로도 충분한 빌드 성능 확보

### Next.js 설정

`next.config.ts` 파일의 주요 설정:

```typescript
const nextConfig: NextConfig = {
  // Turbopack 비활성화 (Webpack 사용)

  // 환경변수 주입을 위한 Webpack 설정
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Service Worker 환경변수 주입 로직
    config.plugins.push(
      new webpack.DefinePlugin({
        // 빌드 시점 환경변수 주입
      }),
    );

    return config;
  },
};
```

## 환경변수 주입 시스템

### 작동 원리

1. **빌드 시점**: Webpack의 `afterEmit` 훅에서 실행
2. **템플릿 읽기**: `firebase-messaging-sw.template.js` 파일 읽기
3. **변수 치환**: `process.env.NEXT_PUBLIC_*` 플레이스홀더를 실제 값으로 치환
4. **파일 생성**: 치환된 내용으로 `firebase-messaging-sw.js` 파일 생성

### 구현 코드

```typescript
function injectEnvToServiceWorker() {
  const templatePath = path.join(
    process.cwd(),
    'public',
    'firebase-messaging-sw.template.js',
  );
  const outputPath = path.join(
    process.cwd(),
    'public',
    'firebase-messaging-sw.js',
  );

  if (!fs.existsSync(templatePath)) {
    console.warn('Service Worker template not found:', templatePath);
    return;
  }

  let content = fs.readFileSync(templatePath, 'utf8');

  // 환경변수 치환
  content = content.replace(
    /process\.env\.NEXT_PUBLIC_FIREBASE_API_KEY/g,
    `"${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}"`,
  );
  // ... 다른 환경변수들도 동일하게 처리

  fs.writeFileSync(outputPath, content);
}
```

## 빌드 스크립트

### 개발 빌드

```bash
npm run dev
```

- 개발 서버 시작
- Hot Module Replacement (HMR) 활성화
- Service Worker 자동 생성

### 프로덕션 빌드

```bash
npm run build
```

- TypeScript 컴파일
- CSS 최적화 및 번들링
- JavaScript 번들링 및 미니파이
- Service Worker 생성
- 정적 파일 최적화

### 빌드 결과 확인

```bash
npm run start
```

- 프로덕션 빌드 결과물로 서버 실행
- 실제 배포 환경과 유사한 조건에서 테스트

## 성능 최적화

### 번들 분석

```bash
# 번들 크기 분석 (별도 도구 설치 필요)
npm install -g @next/bundle-analyzer
npm run analyze
```

### 코드 스플리팅

- **페이지 단위**: Next.js App Router 자동 적용
- **컴포넌트 단위**: `dynamic import` 사용 권장

```typescript
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### 이미지 최적화

```tsx
import Image from 'next/image';

<Image
  src="/images/logo.webp"
  alt="새김 로고"
  width={200}
  height={100}
  priority // 중요한 이미지는 우선 로딩
/>;
```

## 환경별 설정

### 개발 환경

- `.env.development`
- `.env.development.local`
- Hot reload 활성화
- 상세한 에러 메시지

### 프로덕션 환경

- `.env.production`
- `.env.production.local`
- 코드 최적화 및 압축
- 에러 보고 최소화

### 환경변수 우선순위

1. `.env.local` (모든 환경에서 로드, Git 무시)
2. `.env.development` 또는 `.env.production`
3. `.env`

## TypeScript 설정

### `tsconfig.json` 주요 설정

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

### 타입 체크

```bash
# 타입 에러 확인 (빌드 없이)
npx tsc --noEmit
```

## 관련 문서

- [개발 환경 설정](./setup.md)
- [보안 고려사항](./security.md)
- [문제 해결](./troubleshooting.md)
