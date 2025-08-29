/**
 * 타임아웃 및 시간 관련 상수
 * API 호출, 세션 관리, 알림 등에 사용되는 시간 설정
 */
export const TIMEOUTS = {
  // API 호출 타임아웃 (ms)
  API_DEFAULT: 10_000, // 10초 - 기본 API 호출
  API_UPLOAD: 5_000, // 5초 - 파일 업로드

  // 세션 관리 (ms)
  SESSION_EXPIRE: 8 * 60 * 60 * 1000, // 8시간 - 세션 만료
  ACTIVITY_CHECK: 60 * 1000, // 1분 - 활동 체크 간격

  // FCM 및 알림 (ms)
  FCM_RETRY_WAIT: 100, // 100ms - FCM 재시도 대기
  FCM_MAX_RETRIES: 50, // FCM 최대 재시도 횟수

  // 페이지 리다이렉트 (ms)
  REDIRECT_DELAY: 2_000, // 2초 - 성공 메시지 후 리다이렉트
} as const;

/**
 * 검증 및 제한값 상수
 */
export const VALIDATION = {
  // 비밀번호 규칙
  PASSWORD_MIN_LENGTH: 9,

  // 이메일 인증
  VERIFICATION_CODE_LENGTH: 6,

  // 닉네임 규칙
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 10,

  // 알림 관련
  NOTIFICATION_MAX_COUNT: 100,
  NOTIFICATION_HISTORY_DEFAULT_LIMIT: 20,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
export type ValidationKey = keyof typeof VALIDATION;
