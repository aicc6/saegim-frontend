/**
 * 로케일 및 문자열 상수
 * 다국어 지원 및 공통 문자열 관리
 */
export const LOCALES = {
  KOREAN: 'ko-KR',
  ENGLISH: 'en-US',
} as const;

/**
 * HTTP Content-Type 상수
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  JSON_UTF8: 'application/json; charset=utf-8',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
} as const;

/**
 * Accept 헤더 상수
 */
export const ACCEPT_TYPES = {
  JSON: 'application/json',
  JSON_UTF8: 'application/json; charset=utf-8',
  ALL: '*/*',
} as const;

/**
 * 정규식 패턴 상수
 */
export const REGEX_PATTERNS = {
  KOREAN_ENGLISH_ONLY: /^[가-힣a-zA-Z]+$/,
  PASSWORD_COMPLEXITY: {
    LETTER: /[a-zA-Z]/,
    NUMBER: /\d/,
    SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
} as const;

export type LocaleKey = keyof typeof LOCALES;
export type ContentTypeKey = keyof typeof CONTENT_TYPES;
