# Firebase Cloud Messaging (FCM) 설정

새김 프로젝트의 알림 시스템은 Firebase Cloud Messaging을 사용합니다.

## Service Worker 템플릿 시스템

이 프로젝트는 보안성과 Git 관리의 편의성을 위해 Service Worker 템플릿 시스템을 사용합니다.

### 파일 구조

```text
📁 public/
├── 📄 firebase-messaging-sw.template.js  ✅ Git 관리 (소스 템플릿)
└── 📄 firebase-messaging-sw.js           ❌ Git 무시 (빌드 결과물)
```

### 작동 방식

1. **템플릿 파일** (`firebase-messaging-sw.template.js`)
   - 환경변수 플레이스홀더 포함: `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`
   - Git으로 관리됨
   - 개발자가 직접 편집하는 파일

2. **빌드 시점 자동 생성**
   - Webpack의 afterEmit 훅에서 `next.config.ts`의 `injectEnvToServiceWorker` 함수 실행
   - 템플릿 파일을 읽어서 환경변수 플레이스홀더를 실제 값으로 치환
   - `firebase-messaging-sw.js` 파일 자동 생성

3. **최종 결과물** (`firebase-messaging-sw.js`)
   - 실제 Firebase 설정값 포함
   - `.gitignore`에 의해 Git에서 제외
   - 브라우저에서 실제로 사용되는 Service Worker 파일

### 장점

- ✅ **보안성**: 민감한 Firebase 설정이 Git에 노출되지 않음
- ✅ **자동화**: 환경변수 변경 시 자동으로 Service Worker 업데이트
- ✅ **Git 히스토리**: 빌드 결과물이 커밋에 포함되지 않아 깔끔함
- ✅ **유지보수성**: 하나의 템플릿 파일만 관리하면 됨

### 주의사항

⚠️ **템플릿 파일 편집 시 주의점**

- `firebase-messaging-sw.template.js` 파일만 편집하세요
- `firebase-messaging-sw.js` 파일은 절대 직접 편집하지 마세요 (빌드 시마다 덮어씌워짐)
- 환경변수는 반드시 `process.env.NEXT_PUBLIC_*` 형태로 작성하세요

## FCM 기능

### 지원하는 알림 유형

- **일반 알림**: 기본 새김 로고 사용
- **감정별 알림**: 사용자의 감정에 맞는 아이콘 표시
  - `happy`: 기쁨 아이콘
  - `sad`: 슬픔 아이콘
  - `angry`: 분노 아이콘
  - `peaceful`: 평온 아이콘
  - `unrest`: 불안 아이콘

### 알림 동작

- **백그라운드 수신**: 앱이 백그라운드에 있을 때 자동 알림 표시
- **클릭 동작**: 알림 클릭 시 해당 페이지로 이동
- **액션 버튼**: "열기", "닫기" 버튼 제공
- **분석 지원**: 알림 닫힘 이벤트 추적 (향후 분석 서버 연동 예정)

## 구현 컴포넌트

### FCM 관리 컴포넌트

- `src/components/notifications/fcm-manager.tsx`
- `src/stores/fcm.ts` (Zustand 상태 관리)
- `src/types/fcm.ts` (TypeScript 타입 정의)

### 테스트 페이지

개발 환경에서 FCM 기능을 테스트할 수 있는 페이지가 제공됩니다:

- `/fcm-test`: FCM 토큰 확인 및 테스트 알림 발송

## 문제 해결

### FCM이 작동하지 않는 경우

1. 환경변수 확인
2. Service Worker 재생성:

   ```bash
   npm run dev
   ```

3. 브라우저 Service Worker 캐시 삭제

### 알림 권한 문제

1. 브라우저 설정에서 알림 권한 확인
2. HTTPS 환경에서만 작동 (개발 환경에서는 localhost 허용)
3. 사용자가 알림을 차단한 경우 브라우저 설정에서 직접 허용 필요

## 관련 문서

- [보안 고려사항](./security.md)
- [빌드 구성](./build.md)
- [문제 해결](./troubleshooting.md)
