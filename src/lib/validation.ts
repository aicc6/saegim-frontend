/**
 * 공통 검증 로직 유틸리티
 */

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength?: number;
}

/**
 * 통일된 비밀번호 정책
 * 기존 코드의 최고 보안 수준을 기준으로 설정
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: false, // 기존 코드에서 대문자 요구하지 않음
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * 비밀번호 검증 결과
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100 점수
}

/**
 * 비밀번호 검증 함수
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // 길이 검증
  if (password.length < policy.minLength) {
    errors.push(`비밀번호는 ${policy.minLength}자 이상이어야 합니다.`);
  } else {
    score += 25;
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`비밀번호는 ${policy.maxLength}자 이하여야 합니다.`);
  }

  // 대문자 검증
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('비밀번호는 대문자를 포함해야 합니다.');
  } else if (policy.requireUppercase) {
    score += 20;
  }

  // 소문자 검증
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('비밀번호는 소문자를 포함해야 합니다.');
  } else if (policy.requireLowercase && /[a-z]/.test(password)) {
    score += 20;
  }

  // 숫자 검증
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('비밀번호는 숫자를 포함해야 합니다.');
  } else if (policy.requireNumbers && /\d/.test(password)) {
    score += 20;
  }

  // 특수문자 검증
  if (
    policy.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  ) {
    errors.push('비밀번호는 특수문자를 포함해야 합니다.');
  } else if (
    policy.requireSpecialChars &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  ) {
    score += 15;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 100),
  };
}

/**
 * 두 비밀번호가 일치하는지 확인
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): { isValid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: '입력한 비밀번호가 일치하지 않습니다.',
    };
  }
  return { isValid: true };
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return { isValid: false, error: '이메일을 입력해주세요.' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식을 입력해주세요.' };
  }

  return { isValid: true };
}

/**
 * 닉네임 검증 (기존 REGEX_PATTERNS.KOREAN_ENGLISH_ONLY 로직)
 */
export function validateNickname(
  nickname: string,
  minLength: number = 2,
  maxLength: number = 15,
): { isValid: boolean; error?: string } {
  if (!nickname.trim()) {
    return { isValid: false, error: '닉네임을 입력해주세요.' };
  }

  if (nickname.length < minLength) {
    return {
      isValid: false,
      error: `닉네임은 ${minLength}자 이상이어야 합니다.`,
    };
  }

  if (nickname.length > maxLength) {
    return {
      isValid: false,
      error: `닉네임은 ${maxLength}자 이하여야 합니다.`,
    };
  }

  // 한글과 영문만 허용 (기존 REGEX_PATTERNS.KOREAN_ENGLISH_ONLY 로직)
  const koreanEnglishRegex = /^[가-힣a-zA-Z\s]+$/;
  if (!koreanEnglishRegex.test(nickname)) {
    return { isValid: false, error: '닉네임은 한글과 영문만 사용 가능합니다.' };
  }

  return { isValid: true };
}

/**
 * 인증 코드 검증
 */
export function validateVerificationCode(
  code: string,
  requiredLength: number = 6,
): { isValid: boolean; error?: string } {
  if (!code.trim()) {
    return { isValid: false, error: '인증 코드를 입력해주세요.' };
  }

  if (code.length !== requiredLength) {
    return {
      isValid: false,
      error: `인증 코드는 ${requiredLength}자리 숫자입니다.`,
    };
  }

  if (!/^\d+$/.test(code)) {
    return { isValid: false, error: '인증 코드는 숫자만 입력 가능합니다.' };
  }

  return { isValid: true };
}
