# 프로젝트 구조

새김 프론트엔드 프로젝트의 디렉터리 구조와 각 파일의 역할을 설명합니다.

## 전체 구조

```text
saegim-frontend/
├── 📁 docs/                    # 프로젝트 문서
├── 📁 public/                  # 정적 파일
├── 📁 src/                     # 소스 코드
├── 📁 scripts/                 # 빌드/유틸리티 스크립트
├── 📄 next.config.ts           # Next.js 설정
├── 📄 tailwind.config.ts       # Tailwind CSS 설정
├── 📄 tsconfig.json           # TypeScript 설정
└── 📄 package.json            # 프로젝트 의존성
```

## 소스 코드 구조 (`src/`)

### 페이지 (`src/app/`)

Next.js 15 App Router 기반의 페이지 구조:

```text
📁 app/
├── 📄 layout.tsx              # 루트 레이아웃
├── 📄 globals.css             # 전역 스타일
├── 📄 favicon.ico             # 파비콘
├── 📁 (authenticated)/        # 인증 필요 페이지 그룹
│   ├── 📄 layout.tsx          # 인증된 사용자 레이아웃
│   ├── 📄 page.tsx            # 대시보드 (/)
│   ├── 📁 account/            # 계정 관리
│   ├── 📁 calendar/           # 캘린더 뷰
│   ├── 📁 list/               # 다이어리 목록
│   ├── 📁 fcm-test/           # FCM 테스트 페이지
│   └── 📁 notifications/      # 알림 설정
└── 📁 (unauthenticated)/      # 인증 불필요 페이지 그룹
    ├── 📄 layout.tsx          # 비인증 사용자 레이아웃
    ├── 📁 login/              # 로그인
    ├── 📁 signup/             # 회원가입
    └── 📁 landing/            # 랜딩 페이지
```

### 컴포넌트 (`src/components/`)

재사용 가능한 UI 컴포넌트들:

```text
📁 components/
├── 📁 auth/                   # 인증 관련 컴포넌트
│   ├── 📄 login-form.tsx      # 로그인 폼
│   ├── 📄 social-login.tsx    # 소셜 로그인 버튼
│   └── 📄 auth-guard.tsx      # 인증 가드
├── 📁 common/                 # 공통 컴포넌트
│   ├── 📄 header.tsx          # 헤더
│   ├── 📄 sidebar.tsx         # 사이드바
│   ├── 📄 loading.tsx         # 로딩 컴포넌트
│   └── 📄 error-boundary.tsx  # 에러 경계
├── 📁 ui/                     # 기본 UI 컴포넌트
│   ├── 📄 button.tsx          # 버튼
│   ├── 📄 input.tsx           # 입력 필드
│   ├── 📄 modal.tsx           # 모달
│   └── 📄 toast.tsx           # 토스트 알림
├── 📁 individual/             # 다이어리 개별 기능
│   ├── 📄 diary-editor.tsx    # 다이어리 에디터
│   ├── 📄 emotion-selector.tsx # 감정 선택기
│   └── 📄 ai-content.tsx      # AI 생성 콘텐츠
├── 📁 calendar/               # 캘린더 관련
│   ├── 📄 calendar-view.tsx   # 캘린더 뷰
│   └── 📄 date-picker.tsx     # 날짜 선택기
├── 📁 charts/                 # 차트/통계
│   ├── 📄 emotion-chart.tsx   # 감정 차트
│   └── 📄 activity-chart.tsx  # 활동 차트
├── 📁 notifications/          # 알림 관련
│   ├── 📄 fcm-manager.tsx     # FCM 관리자
│   └── 📄 notification-list.tsx # 알림 목록
├── 📁 layout/                 # 레이아웃 컴포넌트
│   ├── 📄 main-layout.tsx     # 메인 레이아웃
│   └── 📄 auth-layout.tsx     # 인증 레이아웃
└── 📁 providers/              # Context Provider들
    ├── 📄 auth-provider.tsx   # 인증 Provider
    └── 📄 theme-provider.tsx  # 테마 Provider
```

### 상태 관리 (`src/stores/`)

Zustand 기반의 전역 상태 관리:

```text
📁 stores/
├── 📄 index.ts                # 스토어 통합 export
├── 📄 auth.ts                 # 인증 상태
├── 📄 diary.ts                # 다이어리 CRUD
├── 📄 emotion.ts              # 감정 선택/관리
├── 📄 fcm.ts                  # FCM 상태 관리
└── 📄 create.ts               # 다이어리 작성 플로우
```

### 타입 정의 (`src/types/`)

TypeScript 타입 정의:

```text
📁 types/
├── 📄 index.ts                # 공통 타입 (EmotionType 등)
├── 📄 diary.ts                # 다이어리 관련 타입
└── 📄 fcm.ts                  # FCM 관련 타입
```

### 라이브러리 (`src/lib/`)

유틸리티 함수와 설정:

```text
📁 lib/
├── 📄 index.ts                # 라이브러리 통합 export
├── 📄 firebase.ts             # Firebase 설정
├── 📄 api.ts                  # API 클라이언트
└── 📄 utils.ts                # 공통 유틸리티 함수
```

### 커스텀 훅 (`src/hooks/`)

재사용 가능한 React 훅:

```text
📁 hooks/
├── 📄 use-local-storage.ts    # 로컬 스토리지 훅
├── 📄 use-mobile.ts           # 모바일 감지 훅
├── 📄 use-notifications.ts    # 알림 관리 훅
└── 📄 use-toast.ts            # 토스트 알림 훅
```

### 컨텍스트 (`src/contexts/`)

React Context 정의:

```text
📁 contexts/
└── 📄 sidebar-context.tsx     # 사이드바 컨텍스트
```

## 정적 파일 (`public/`)

브라우저에서 직접 접근 가능한 파일들:

```text
📁 public/
├── 📄 firebase-messaging-sw.template.js  # FCM Service Worker 템플릿
├── 📄 firebase-messaging-sw.js           # 생성된 Service Worker
├── 📄 file.svg                           # 파일 아이콘
├── 📄 globe.svg                          # 글로브 아이콘
├── 📄 window.svg                         # 윈도우 아이콘
└── 📁 images/                            # 이미지 파일들
    ├── 📄 logo.webp                      # 새김 로고
    ├── 📄 logoop.png                     # 로고 PNG 버전
    └── 📄 loading.png                    # 로딩 이미지
```

## 설정 파일들

### TypeScript 설정

- `tsconfig.json`: TypeScript 컴파일러 설정
- `next-env.d.ts`: Next.js 타입 정의

### 스타일링 설정

- `tailwind.config.ts`: Tailwind CSS 설정
- `postcss.config.mjs`: PostCSS 설정
- `src/app/globals.css`: 전역 CSS

### 빌드 도구 설정

- `next.config.ts`: Next.js 설정
- `eslint.config.mjs`: ESLint 설정
- `.prettierrc.mjs`: Prettier 설정

### 환경 설정

- `.env.example`: 환경변수 예시
- `.env.development`: 개발 환경 기본값
- `.env.production`: 프로덕션 환경 기본값
- `.gitignore`: Git 무시 파일 목록

## 파일 명명 규칙

### 컴포넌트 파일

- **React 컴포넌트**: `kebab-case.tsx` (예: `diary-editor.tsx`)
- **Page 컴포넌트**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### 비 컴포넌트 파일

- **유틸리티**: `kebab-case.ts` (예: `api-client.ts`)
- **타입 정의**: `kebab-case.ts` (예: `diary-types.ts`)
- **훅**: `use-kebab-case.ts` (예: `use-local-storage.ts`)

### 디렉터리

- **모든 폴더**: `kebab-case` (예: `components/`, `user-management/`)
- **Next.js 라우트 그룹**: `(group-name)` (예: `(authenticated)/`)

## 아키텍처 패턴

### 컴포넌트 계층

1. **Page Components**: 페이지 레벨 컴포넌트
2. **Feature Components**: 기능별 컴포넌트
3. **UI Components**: 재사용 가능한 기본 UI
4. **Layout Components**: 레이아웃 전용 컴포넌트

### 상태 관리 패턴

1. **Global State**: Zustand 스토어 (인증, 다이어리 등)
2. **Local State**: React useState (컴포넌트 내부 상태)
3. **Server State**: API 호출 결과 (향후 React Query 고려)

### 코드 분할

- **Route-based**: 페이지별 자동 분할 (Next.js)
- **Component-based**: 동적 import를 통한 lazy loading

## 관련 문서

- [개발 환경 설정](./setup.md)
- [빌드 구성](./build.md)
- [Firebase Cloud Messaging 설정](./fcm.md)
