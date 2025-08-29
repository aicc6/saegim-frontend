# 로깅 시스템 가이드

새김 프론트엔드 프로젝트의 체계적인 로깅 시스템 사용법입니다.

## 기본 사용법

### 로거 생성 및 사용

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('moduleName'); // 모듈명으로 로거 생성

// 로그 레벨별 사용
logger.trace('가장 상세한 디버깅 정보');
logger.debug('개발시 디버깅 정보');
logger.info('일반적인 동작 정보');
logger.warn('경고 메시지');
logger.error('오류 메시지');
```

### 로그 레벨 가이드라인

- **TRACE**: 매우 상세한 디버깅 (함수 호출, 변수 값 등)
- **DEBUG**: 개발시 필요한 디버깅 정보
- **INFO**: 일반적인 동작, 성공 메시지
- **WARN**: 경고, 예상 가능한 문제
- **ERROR**: 에러, 예외 상황

## 환경별 설정

### 환경변수 설정

```bash
# .env.local
NEXT_PUBLIC_LOG_LEVEL=INFO  # 프로덕션에서 INFO 이상만 출력
```

### 기본 동작

- **개발 환경**: DEBUG 레벨 (모든 로그 출력)
- **프로덕션 환경**: WARN 레벨 (경고/오류만 출력)

## 고급 기능

### 글로벌 로그 레벨 설정

```typescript
import { setGlobalLogLevel, LogLevel } from '@/lib/logger';

// 전역 로그 레벨 변경
setGlobalLogLevel(LogLevel.INFO);
setGlobalLogLevel('ERROR'); // 문자열로도 가능
```

### 모듈별 로그 레벨 설정

```typescript
import { setModuleLogLevel, removeModuleLogLevel } from '@/lib/logger';

// 특정 모듈만 TRACE 레벨로 설정
setModuleLogLevel('fcm', LogLevel.TRACE);

// 특정 모듈 설정 제거 (전역 설정 따름)
removeModuleLogLevel('fcm');
```

### 로거 상태 조회

```typescript
import { getAllLoggers, getLoggingConfig } from '@/lib/logger';

// 모든 로거 상태 조회
const loggers = getAllLoggers();
console.log(loggers);

// 로깅 설정 조회
const config = getLoggingConfig();
console.log(config);
```

## 개발자 도구 사용법

개발 환경에서는 브라우저 콘솔에서 다음 명령어 사용 가능:

```javascript
// 전역 로그 레벨 설정
__SAEGIM_LOGGER__.setGlobalLevel('DEBUG');

// 특정 모듈 로그 레벨 설정
__SAEGIM_LOGGER__.setModuleLevel('fcm', 'TRACE');

// 모든 로거 상태 조회
__SAEGIM_LOGGER__.getAllLoggers();

// 설정 조회
__SAEGIM_LOGGER__.getConfig();

// 모든 설정 리셋
__SAEGIM_LOGGER__.resetAll();
```

## 기존 코드에서 마이그레이션

기존 `console.log` 호출을 다음과 같이 교체:

```typescript
// 기존
console.log('사용자 로그인:', userId);
console.error('API 호출 실패:', error);

// 새로운 방식
import { getLogger } from '@/lib/logger';
const logger = getLogger('auth');

logger.info('사용자 로그인:', userId);
logger.error('API 호출 실패:', error);
```

## 성능 최적화

로그 생성 비용이 큰 경우 조건부 실행:

```typescript
import { LogLevel } from '@/lib/logger';

// 비용이 큰 로그 데이터 생성을 조건부로 실행
if (logger.getLevel() <= LogLevel.DEBUG) {
  const expensiveData = generateExpensiveLogData();
  logger.debug('비싼 로그 데이터:', expensiveData);
}
```

## 프로덕션 고려사항

- 프로덕션에서는 기본적으로 WARN 레벨 이상만 출력
- 민감한 정보는 절대 로그에 포함하지 않음
- 로그 설정은 localStorage에 자동 저장됨
- 환경변수를 통한 런타임 제어 가능

## 문제 해결

### 로그가 출력되지 않는 경우

1. 현재 로그 레벨 확인
2. 모듈별 설정 확인
3. 환경변수 설정 확인

```typescript
const config = getLoggingConfig();
console.log('현재 설정:', config);
```

### 설정 초기화

```typescript
import { resetAllLoggers } from '@/lib/logger';
resetAllLoggers(); // 모든 설정을 기본값으로 초기화
```
