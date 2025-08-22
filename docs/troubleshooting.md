# 문제 해결 가이드

새김 프론트엔드 개발 중 발생할 수 있는 일반적인 문제들과 해결 방법을 안내합니다.

## Service Worker 관련 문제

### FCM이 작동하지 않는 경우

**증상**:

- 알림이 수신되지 않음
- Service Worker 등록 실패
- 토큰 생성 실패

**해결 방법**:

1. **개발 서버 재시작**

   ```bash
   npm run dev
   ```

2. **브라우저 캐시 삭제**
   - Chrome: F12 → Application → Storage → Clear storage
   - Firefox: F12 → Storage → Clear All

3. **Service Worker 상태 확인**
   - Chrome: F12 → Application → Service Workers
   - Firefox: F12 → Application → Service Workers

4. **환경변수 확인**
   ```bash
   # .env.local 파일 확인
   cat .env.local
   ```

### Service Worker 파일이 생성되지 않는 경우

**원인**:

- 템플릿 파일 누락
- 환경변수 미설정
- 빌드 프로세스 오류

**해결 방법**:

1. **템플릿 파일 확인**

   ```bash
   ls -la public/firebase-messaging-sw.template.js
   ```

2. **환경변수 설정 확인**

   ```bash
   echo $NEXT_PUBLIC_FIREBASE_API_KEY
   ```

3. **수동 생성 테스트**
   ```bash
   # 개발 서버 중지 후
   rm public/firebase-messaging-sw.js
   npm run dev
   # 파일이 자동 생성되는지 확인
   ls -la public/firebase-messaging-sw.js
   ```

## 환경변수 관련 문제

### 환경변수가 반영되지 않는 경우

**증상**:

- 설정한 환경변수가 `undefined`로 표시
- Firebase 초기화 실패
- API 호출 실패

**해결 방법**:

1. **파일명 확인**

   ```bash
   # 올바른 파일명인지 확인
   ls -la .env*
   ```

2. **변수명 확인**
   - 클라이언트 사용: `NEXT_PUBLIC_` 접두사 필수
   - 서버 사용: 접두사 없음

3. **개발 서버 재시작**

   ```bash
   # 환경변수 변경 후 반드시 재시작
   npm run dev
   ```

4. **환경변수 로드 확인**
   ```typescript
   console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
   ```

### 환경별 설정 충돌

**증상**:

- 다른 환경의 설정이 적용됨
- 예상과 다른 API 엔드포인트 호출

**해결 방법**:

1. **환경변수 우선순위 확인**

   ```text
   1. .env.local (최우선)
   2. .env.development / .env.production
   3. .env (기본값)
   ```

2. **불필요한 파일 제거**
   ```bash
   # 필요없는 환경 파일 삭제
   rm .env.development.local
   ```

## 빌드 관련 문제

### 빌드 오류 발생 시

**일반적인 빌드 오류**:

1. **TypeScript 에러**

   ```bash
   # 타입 체크만 실행
   npx tsc --noEmit
   ```

2. **ESLint 에러**

   ```bash
   # 린트 에러 자동 수정
   npm run lint:fix
   ```

3. **캐시 문제**
   ```bash
   # 캐시 삭제 후 재설치
   npm run clean:install
   ```

### 의존성 충돌

**증상**:

- 패키지 설치 실패
- 런타임 에러
- 버전 호환성 문제

**해결 방법**:

1. **package-lock.json 삭제 후 재설치**

   ```bash
   rm package-lock.json
   rm -rf node_modules
   npm install
   ```

2. **Node.js 버전 확인**

   ```bash
   node --version  # 18.17 이상 필요
   npm --version   # 9.0 이상 필요
   ```

3. **의존성 업데이트**
   ```bash
   npm outdated
   npm update
   ```

## 개발 환경 문제

### Turbopack 관련 오류

**증상**:

- 모듈 로딩 실패
- 빌드 시 Turbopack 에러

**해결 방법**:
이 프로젝트는 이미 Webpack 모드로 구성되어 있어 Turbopack 관련 문제가 해결되었습니다.

### 포트 충돌

**증상**:

- `EADDRINUSE` 에러
- 개발 서버 시작 실패

**해결 방법**:

1. **사용 중인 포트 확인**

   ```bash
   lsof -i :3000
   ```

2. **프로세스 종료**

   ```bash
   kill -9 <PID>
   ```

3. **다른 포트 사용**
   ```bash
   npm run dev -- --port 3001
   ```

### Hot Reload 작동 안 함

**증상**:

- 코드 변경이 반영되지 않음
- 수동 새로고침 필요

**해결 방법**:

1. **파일 경로 확인**
   - `src/` 디렉터리 내부 파일인지 확인
   - 올바른 파일 확장자 사용 (`.tsx`, `.ts`)

2. **개발 서버 재시작**
   ```bash
   npm run dev
   ```

## Firebase 관련 문제

### 인증 실패

**증상**:

- 로그인 버튼 클릭 시 오류
- `Firebase: Error (auth/configuration-not-found)`

**해결 방법**:

1. **Firebase 설정 확인**

   ```typescript
   // Firebase 초기화 상태 확인
   console.log('Firebase initialized:', getApps().length > 0);
   ```

2. **프로젝트 설정 확인**
   - Firebase Console에서 프로젝트 설정 확인
   - Authentication 활성화 여부 확인

### 알림 권한 문제

**증상**:

- 알림 권한 요청 팝업이 나타나지 않음
- 권한이 차단된 상태

**해결 방법**:

1. **HTTPS 환경 확인**
   - 로컬 개발: `localhost` 또는 `127.0.0.1` 사용
   - 프로덕션: HTTPS 필수

2. **브라우저 설정 확인**
   - Chrome: 설정 → 개인정보 보호 및 보안 → 사이트 설정 → 알림
   - 해당 사이트의 알림 권한을 "허용"으로 변경

3. **권한 재요청**
   ```typescript
   // 권한 상태 확인
   const permission = await Notification.requestPermission();
   console.log('Notification permission:', permission);
   ```

## 성능 관련 문제

### 느린 빌드 시간

**해결 방법**:

1. **캐시 활용**

   ```bash
   # Next.js 캐시 확인
   ls -la .next/cache
   ```

2. **불필요한 파일 제외**
   - `.gitignore` 확인
   - `node_modules` 크기 확인

3. **번들 분석**
   ```bash
   npm run build
   # 빌드 결과 분석
   ```

### 런타임 성능 저하

**해결 방법**:

1. **개발자 도구 프로파일링**
   - Chrome DevTools → Performance 탭
   - React DevTools Profiler

2. **불필요한 리렌더링 확인**
   ```typescript
   // React DevTools 또는 useEffect로 확인
   useEffect(() => {
     console.log('Component re-rendered');
   });
   ```

## 도움 요청하기

위의 해결 방법으로도 문제가 해결되지 않을 경우:

1. **에러 로그 수집**
   - 브라우저 콘솔 에러 메시지
   - 터미널 에러 로그
   - 네트워크 탭 확인

2. **환경 정보 제공**
   - Node.js 버전
   - npm 버전
   - 운영체제
   - 브라우저 종류 및 버전

3. **재현 단계 기록**
   - 문제 발생 전 수행한 작업
   - 정확한 에러 메시지
   - 스크린샷 (필요시)

## 관련 문서

- [개발 환경 설정](./setup.md)
- [Firebase Cloud Messaging 설정](./fcm.md)
- [빌드 구성](./build.md)
- [보안 고려사항](./security.md)
