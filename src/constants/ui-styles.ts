/**
 * 공통 UI 스타일 상수 정의
 */

// 공통 입력 필드 스타일
export const INPUT_STYLES = {
  base: 'w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',

  // 기본 입력 필드
  primary:
    'bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder',

  // 읽기 전용 입력 필드
  readonly:
    'bg-gray-100 dark:bg-background-dark-secondary border border-gray-300 dark:border-border-dark-subtle text-gray-600 dark:text-text-dark-secondary cursor-not-allowed',

  // 검색 입력 필드
  search:
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 focus:ring-green-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400',
} as const;

// 공통 버튼 스타일 (기존 saegim-button과 함께 사용)
export const BUTTON_STYLES = {
  base: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // 버튼 변형
  variants: {
    primary: 'bg-sage-60 hover:bg-sage-70 text-white focus:ring-sage-50',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost:
      'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    brand:
      'bg-[#5C8D89] hover:bg-[#4A7A76] text-white dark:text-text-dark-on-color hover:opacity-90 active:opacity-100 shadow-sm hover:shadow-md focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary',
  },

  // 크기
  sizes: {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-6 py-4 text-lg',
  },
} as const;

// 공통 모달 스타일
export const MODAL_STYLES = {
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
  content:
    'fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md',
  header: 'text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100',
  footer: 'flex justify-end gap-3 mt-6',
} as const;

// 공통 카드 스타일
export const CARD_STYLES = {
  base: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors',
  hover: 'hover:shadow-md hover:border-sage-30 dark:hover:border-gray-600',
  padding: {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  },
} as const;

// 유틸리티 함수들
export const createInputClassName = (
  variant: keyof typeof INPUT_STYLES = 'primary',
  custom?: string,
) => {
  return `${INPUT_STYLES.base} ${INPUT_STYLES[variant]} ${custom || ''}`.trim();
};

export const createButtonClassName = (
  variant: keyof typeof BUTTON_STYLES.variants = 'primary',
  size: keyof typeof BUTTON_STYLES.sizes = 'medium',
  custom?: string,
) => {
  return `${BUTTON_STYLES.base} ${BUTTON_STYLES.variants[variant]} ${BUTTON_STYLES.sizes[size]} ${custom || ''}`.trim();
};

export const createCardClassName = (
  withHover: boolean = false,
  padding: keyof typeof CARD_STYLES.padding = 'medium',
  custom?: string,
) => {
  return `${CARD_STYLES.base} ${withHover ? CARD_STYLES.hover : ''} ${CARD_STYLES.padding[padding]} ${custom || ''}`.trim();
};
