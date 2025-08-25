# 개발/테스트용 컴포넌트

이 디렉토리는 개발 및 테스트 환경에서만 사용되는 컴포넌트들을 포함합니다.

## 포함된 컴포넌트

### FCM 관련

- **FCMTestPanel** (`fcm-test-panel.tsx`)
  - 백엔드 FCM API와의 연동 상태 테스트
  - 토큰 등록, 설정 동기화, 알림 전송 테스트
  - API 응답 상태 확인

- **FCMManager** (`fcm-manager.tsx`)
  - FCM 토큰 관리 및 알림 테스트
  - 브라우저 푸시 알림 기능 테스트
  - 알림 권한 관리

## 사용법

```tsx
import { FCMTestPanel, FCMManager, DevOnly } from '@/components/dev';

// 개발 환경에서만 렌더링
<DevOnly>
  <FCMTestPanel />
  <FCMManager />
</DevOnly>
```

## 주의사항

- 이 컴포넌트들은 개발/테스트 목적으로만 사용됩니다
- 프로덕션 빌드에서는 제외되어야 합니다
- `DevOnly` 래퍼를 사용하여 프로덕션에서 렌더링을 방지할 수 있습니다

## 디렉토리 구조

```
components/dev/
├── fcm-test-panel.tsx    # FCM API 연동 테스트 패널
├── fcm-manager.tsx       # FCM 토큰 및 알림 관리
├── index.ts              # 내보내기 및 유틸리티
└── README.md             # 문서 (이 파일)
```