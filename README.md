# 새김 프론트엔드

새김(Saegim) - 감성 AI 다이어리 서비스의 프론트엔드 애플리케이션입니다.

## 🚀 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand
- **알림시스템**: Firebase Cloud Messaging (FCM)
- **빌드도구**: Webpack (Turbopack 비활성화)

## � 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 Firebase 설정을 추가하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... 기타 Firebase 설정
```

자세한 환경변수 설정은 [개발 환경 설정 가이드](./docs/setup.md)를 참고하세요.

### 3. 개발 서버 시작

```bash
npm run dev
```

## � 문서

프로젝트의 상세한 정보는 다음 문서들을 참고하세요:

- **[개발 환경 설정](./docs/setup.md)** - 프로젝트 설정 및 개발 환경 구성
- **[Firebase Cloud Messaging 설정](./docs/fcm.md)** - FCM 알림 시스템 설정 및 Service Worker 관리
- **[빌드 구성](./docs/build.md)** - Next.js 빌드 시스템 및 Webpack 설정
- **[보안 고려사항](./docs/security.md)** - 환경변수 관리 및 보안 베스트 프랙티스
- **[프로젝트 구조](./docs/structure.md)** - 디렉터리 구조 및 파일 구성
- **[문제 해결](./docs/troubleshooting.md)** - 일반적인 문제 및 해결 방법

## 🛠️ 주요 스크립트

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 코드 검사 및 포맷팅
npm run lint
npm run format
```

## 🔔 FCM 알림 시스템

새김 프로젝트는 Firebase Cloud Messaging을 사용한 실시간 알림 기능을 제공합니다.

### 주요 특징

- **감정별 알림**: 사용자의 감정에 맞는 맞춤형 알림
- **Service Worker 템플릿**: 보안성과 유지보수성을 위한 템플릿 기반 시스템
- **실시간 알림**: 백그라운드에서도 알림 수신 가능

자세한 설정 방법은 [FCM 설정 가이드](./docs/fcm.md)를 참고하세요.

## 🏗️ 프로젝트 구조

```text
src/
├── app/              # Next.js App Router (페이지)
├── components/       # 재사용 가능한 UI 컴포넌트
├── stores/          # Zustand 상태 관리
├── types/           # TypeScript 타입 정의
├── lib/             # 라이브러리, 유틸리티
└── hooks/           # 커스텀 React 훅

docs/                # 프로젝트 문서
public/              # 정적 파일
```

전체 구조에 대한 자세한 설명은 [프로젝트 구조 가이드](./docs/structure.md)를 참고하세요.

## 🚨 문제 해결

개발 중 문제가 발생하면 [문제 해결 가이드](./docs/troubleshooting.md)를 확인하거나 다음을 시도해보세요:

```bash
# 캐시 삭제 후 재설치
npm run clean:install

# 개발 서버 재시작
npm run dev
```

## 📄 라이선스

이 프로젝트는 새김 팀의 소유입니다.
