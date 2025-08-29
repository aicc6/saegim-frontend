'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useApiError } from '@/hooks/use-api-error';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateNickname,
  validateVerificationCode,
} from '@/lib/validation';
import { FormInput } from '@/components/ui/form-input';
import { BRAND_COLORS } from '@/constants/brand';
import { VALIDATION } from '@/constants/timeouts';

export default function SignupForm() {
  const router = useRouter();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'SignupForm',
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    verificationCode: '',
  });

  // 검증 에러 상태
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    nickname?: string;
    verificationCode?: string;
  }>({});

  const [emailVerified, setEmailVerified] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // 폼 검증 함수
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // 이메일 검증
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0]; // 첫 번째 에러만 표시
    }

    // 비밀번호 확인 검증
    const confirmValidation = validatePasswordConfirmation(
      formData.password,
      formData.confirmPassword,
    );
    if (!confirmValidation.isValid) {
      newErrors.confirmPassword = confirmValidation.error;
    }

    // 닉네임 검증
    const nicknameValidation = validateNickname(
      formData.nickname,
      VALIDATION.NICKNAME_MIN_LENGTH,
      VALIDATION.NICKNAME_MAX_LENGTH,
    );
    if (!nicknameValidation.isValid) {
      newErrors.nickname = nicknameValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 에러 상태 초기화
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // 닉네임 필드인 경우 중복 확인 상태 초기화
    if (name === 'nickname' && nicknameChecked) {
      setNicknameChecked(false);
    }

    // 이메일 필드인 경우 인증 상태 초기화
    if (name === 'email' && emailVerified) {
      setEmailVerified(false);
      setCodeSent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    if (!validateForm()) {
      return;
    }

    if (!emailVerified || !nicknameChecked) {
      handleApiError(
        new Error('입력 확인 필요'),
        '입력 확인 필요',
        '이메일 인증과 닉네임 중복 확인을 완료해주세요.',
      );
      return;
    }

    setIsLoading(true);

    try {
      await authApi.signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
      });

      showSuccess('회원가입 성공', '새김에 가입해주셔서 감사합니다!');

      // 로그인 페이지로 이동
      router.push('/login');
    } catch (error: unknown) {
      handleApiError(
        error,
        '회원가입 실패',
        '회원가입 중 오류가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setErrors((prev) => ({ ...prev, email: emailValidation.error }));
      return;
    }

    setIsSendingCode(true);

    try {
      // 먼저 이메일 중복 확인
      const emailCheckResponse = await authApi.checkEmail(formData.email);

      const emailCheckData = emailCheckResponse.data as {
        available?: boolean;
        [key: string]: unknown;
      };

      if (!emailCheckData.available) {
        setErrors((prev) => ({
          ...prev,
          email: '이미 사용 중인 이메일입니다.',
        }));
        return;
      }

      // 인증 코드 발송
      await authApi.sendVerificationEmail({ email: formData.email });

      setCodeSent(true);
      showSuccess('인증 코드 발송', '이메일로 인증 코드가 발송되었습니다.');
    } catch (error: unknown) {
      handleApiError(
        error,
        '인증 코드 발송 실패',
        '인증 코드 발송 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const codeValidation = validateVerificationCode(
      formData.verificationCode,
      VALIDATION.VERIFICATION_CODE_LENGTH,
    );
    if (!codeValidation.isValid) {
      setErrors((prev) => ({
        ...prev,
        verificationCode: codeValidation.error,
      }));
      return;
    }

    setIsVerifyingCode(true);

    try {
      await authApi.verifyEmail({
        email: formData.email,
        verification_code: formData.verificationCode,
      });

      setEmailVerified(true);
      showSuccess('이메일 인증 완료', '이메일 인증이 완료되었습니다.');
    } catch (error: unknown) {
      handleApiError(error, '인증 실패', '인증 코드가 올바르지 않습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleNicknameCheck = async () => {
    const nicknameValidation = validateNickname(
      formData.nickname,
      VALIDATION.NICKNAME_MIN_LENGTH,
      VALIDATION.NICKNAME_MAX_LENGTH,
    );
    if (!nicknameValidation.isValid) {
      setErrors((prev) => ({ ...prev, nickname: nicknameValidation.error }));
      return;
    }

    try {
      const response = await authApi.checkNickname(formData.nickname);

      const responseData = response.data as {
        available?: boolean;
        [key: string]: unknown;
      };

      if (responseData.available) {
        setNicknameChecked(true);
        showSuccess('닉네임 확인 완료', '사용 가능한 닉네임입니다.');
      } else {
        setErrors((prev) => ({
          ...prev,
          nickname: '이미 사용 중인 닉네임입니다.',
        }));
      }
    } catch (error: unknown) {
      handleApiError(
        error,
        '닉네임 확인 실패',
        '닉네임 확인 중 오류가 발생했습니다.',
      );
    }
  };

  // 회원가입 버튼 활성화 조건
  const isFormValid = () => {
    const hasRequiredFields =
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.nickname;
    const passwordsMatch = formData.password === formData.confirmPassword;
    // 비밀번호 복잡성 검사 (통합 검증 사용)
    const passwordValidation = validatePassword(formData.password);
    const isPasswordComplex = passwordValidation.isValid;

    return hasRequiredFields && passwordsMatch && isPasswordComplex;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 회원가입 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: BRAND_COLORS.PRIMARY }}
        >
          새김에 가입하세요
        </h2>
        <div
          className="mb-10 space-y-2"
          style={{ color: BRAND_COLORS.SECONDARY }}
        >
          <p className="text-base font-light tracking-wide">
            AI와 함께하는 감성 다이어리로
          </p>
          <p className="text-base font-light tracking-wide">
            일상을 기록해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이메일 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <FormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="이메일 입력"
                error={errors.email}
                required
                disabled={emailVerified}
              />
            </div>
            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={!formData.email || emailVerified || isSendingCode}
              className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              {isSendingCode
                ? '발송중...'
                : emailVerified
                  ? '인증완료'
                  : '인증'}
            </button>
          </div>
        </div>

        {/* 이메일 인증 코드 입력 */}
        {codeSent && !emailVerified && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div className="flex-1">
                <FormInput
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  placeholder={`인증 코드 ${VALIDATION.VERIFICATION_CODE_LENGTH}자리 입력`}
                  error={errors.verificationCode}
                  maxLength={VALIDATION.VERIFICATION_CODE_LENGTH}
                  disabled={isVerifyingCode}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={
                  !formData.verificationCode ||
                  formData.verificationCode.length !==
                    VALIDATION.VERIFICATION_CODE_LENGTH ||
                  isVerifyingCode
                }
                className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
                style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
              >
                {isVerifyingCode ? '확인중...' : '확인'}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
              이메일로 발송된 6자리 인증 코드를 입력해주세요.
            </p>
          </div>
        )}

        {/* 비밀번호 입력 */}
        <FormInput
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder={`비밀번호 입력 (영문, 숫자, 특수문자 포함 ${VALIDATION.PASSWORD_MIN_LENGTH}자 이상)`}
          error={errors.password}
          required
        />

        {/* 비밀번호 확인 */}
        <FormInput
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="비밀번호 확인"
          error={errors.confirmPassword}
          required
        />

        {/* 닉네임 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <FormInput
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                maxLength={VALIDATION.NICKNAME_MAX_LENGTH}
                placeholder={`닉네임 입력 (${VALIDATION.NICKNAME_MIN_LENGTH}-${VALIDATION.NICKNAME_MAX_LENGTH}자, 한글/영문만)`}
                error={errors.nickname}
                required
                disabled={nicknameChecked}
              />
            </div>
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={!formData.nickname || nicknameChecked}
              className="px-4 py-3 text-white dark:text-text-dark-on-color rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              {nicknameChecked ? '확인완료' : '중복확인'}
            </button>
          </div>
        </div>

        {/* 회원가입하기 버튼 */}
        <button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="w-full text-white dark:text-text-dark-on-color py-3 px-4 rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base tracking-wide shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
          style={{ backgroundColor: '#5C8D89' }}
        >
          {isLoading ? '회원가입 중...' : '회원가입하기'}
        </button>
      </form>
    </div>
  );
}
