/**
 * 상수 통합 export
 * 프로젝트 전역에서 사용되는 모든 상수를 중앙에서 관리
 */

// 브랜딩 관련
export { BRAND_COLORS, BRAND_ASSETS, type BrandColor } from './brand';

// 시간 및 검증 관련
export {
  TIMEOUTS,
  VALIDATION,
  type TimeoutKey,
  type ValidationKey,
} from './timeouts';

// 로케일 및 문자열 관련
export {
  LOCALES,
  CONTENT_TYPES,
  ACCEPT_TYPES,
  REGEX_PATTERNS,
  type LocaleKey,
  type ContentTypeKey,
} from './locale';

// UI 스타일 관련
export {
  INPUT_STYLES,
  BUTTON_STYLES,
  MODAL_STYLES,
  CARD_STYLES,
  TEXT_STYLES,
  createInputClassName,
  createButtonClassName,
  createCardClassName,
} from './ui-styles';
