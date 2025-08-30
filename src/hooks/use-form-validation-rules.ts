import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateNickname,
  validateVerificationCode,
} from '@/lib/validation';
import { VALIDATION } from '@/constants';

/**
 * React Hook Form용 통합 검증 규칙 훅
 * 중복된 검증 로직을 제거하고 일관된 에러 메시지 제공
 */
export const useFormValidationRules = () => {
  // 이메일 검증 규칙
  const emailRules = {
    required: '이메일을 입력해주세요.',
    validate: (value: string) => {
      const validation = validateEmail(value);
      return validation.isValid || validation.error;
    },
  };

  // 비밀번호 검증 규칙
  const passwordRules = {
    required: '비밀번호를 입력해주세요.',
    validate: (value: string) => {
      const validation = validatePassword(value);
      return validation.isValid ? true : validation.errors[0];
    },
  };

  // 비밀번호 확인 검증 규칙 (원본 비밀번호 필요)
  const passwordConfirmRules = (originalPassword: string) => ({
    required: '비밀번호 확인을 입력해주세요.',
    validate: (value: string) => {
      const validation = validatePasswordConfirmation(originalPassword, value);
      return validation.isValid || validation.error;
    },
  });

  // 새 비밀번호 검증 규칙 (현재 비밀번호와 비교)
  const newPasswordRules = (currentPassword?: string) => ({
    required: '새 비밀번호를 입력해주세요.',
    validate: (value: string) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        return validation.errors[0];
      }
      if (currentPassword && value === currentPassword) {
        return '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      }
      return true;
    },
  });

  // 닉네임 검증 규칙
  const nicknameRules = {
    required: '닉네임을 입력해주세요.',
    maxLength: {
      value: VALIDATION.NICKNAME_MAX_LENGTH,
      message: `닉네임은 ${VALIDATION.NICKNAME_MAX_LENGTH}자 이하여야 합니다.`,
    },
    validate: (value: string) => {
      const validation = validateNickname(
        value,
        VALIDATION.NICKNAME_MIN_LENGTH,
        VALIDATION.NICKNAME_MAX_LENGTH,
      );
      return validation.isValid || validation.error;
    },
  };

  // 인증 코드 검증 규칙
  const verificationCodeRules = {
    required: '인증 코드를 입력해주세요.',
    minLength: {
      value: VALIDATION.VERIFICATION_CODE_LENGTH,
      message: `인증 코드는 ${VALIDATION.VERIFICATION_CODE_LENGTH}자여야 합니다.`,
    },
    maxLength: {
      value: VALIDATION.VERIFICATION_CODE_LENGTH,
      message: `인증 코드는 ${VALIDATION.VERIFICATION_CODE_LENGTH}자여야 합니다.`,
    },
    validate: (value: string) => {
      const validation = validateVerificationCode(
        value,
        VALIDATION.VERIFICATION_CODE_LENGTH,
      );
      return validation.isValid || validation.error;
    },
  };

  // 필수 입력 규칙
  const requiredRule = (message: string) => ({
    required: message,
  });

  return {
    emailRules,
    passwordRules,
    passwordConfirmRules,
    newPasswordRules,
    nicknameRules,
    verificationCodeRules,
    requiredRule,
  };
};
