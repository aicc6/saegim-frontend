'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { authApi } from '@/lib/api/auth';
import { BRAND_COLORS, VALIDATION, TEXT_STYLES } from '@/constants';
import { createSignupSchema, type SignupFormData } from '@/schemas/auth';
import { NicknameAvailabilityResponse } from '@/types/api';
import { getLogger } from '@/lib/logger';

export default function SignupForm() {
  const router = useRouter();
  const logger = getLogger('SignupForm');
  const { t } = useTranslation();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'SignupForm',
  });

  const schema = useMemo(() => createSignupSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  // Watch specific fields for business logic
  const email = watch('email');
  const password = watch('password');
  const nickname = watch('nickname');
  const verificationCode = watch('verificationCode');

  // Business logic states (kept as useState)
  const [emailVerified, setEmailVerified] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Reset business logic states when fields change
  const resetEmailVerification = () => {
    setEmailVerified(false);
    setCodeSent(false);
  };

  const resetNicknameCheck = () => {
    setNicknameChecked(false);
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!emailVerified || !nicknameChecked) {
      handleApiError(
        new Error(t('auth.signup.incompleteTitle')),
        t('auth.signup.incompleteTitle'),
        t('auth.signup.incompleteDescription'),
      );
      return;
    }

    // 폼 제출 시 이전 서버 에러들 클리어
    clearErrors();

    // 디버깅을 위한 데이터 로깅
    const signupData = {
      email: data.email,
      password: data.password,
      nickname: data.nickname,
    };
    logger.debug('📤 회원가입 데이터 전송', signupData);

    try {
      await authApi.signup(signupData);

      showSuccess(t('auth.signupSuccess'), t('auth.signup.successDescription'));
      router.push('/login');
    } catch (error: unknown) {
      logger.error('🚨 회원가입 에러 발생', { error });
      handleApiError(
        error,
        t('auth.signup.failureTitle'),
        t('auth.signup.failureDescription'),
        setError,
      );
    }
  };

  const handleSendVerificationCode = async () => {
    if (!email) return;

    // 폼 검증 트리거
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    setIsSendingCode(true);

    try {
      // 먼저 이메일 중복 확인
      const emailCheckResponse = await authApi.checkEmail(email);

      const emailCheckData = emailCheckResponse.data as {
        available?: boolean;
        [key: string]: unknown;
      };

      if (!emailCheckData.available) {
        handleApiError(
          new Error(t('auth.signup.emailUnavailableTitle')),
          t('auth.signup.emailUnavailableTitle'),
          t('auth.signup.emailUnavailableDescription'),
        );
        return;
      }

      // 인증 코드 발송
      await authApi.sendVerificationEmail({ email });

      setCodeSent(true);
      showSuccess(
        t('auth.signup.codeSentTitle'),
        t('auth.signup.codeSentDescription'),
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.signup.codeSendErrorTitle'),
        t('auth.signup.codeSendErrorDescription'),
        setError, // 서버 검증 에러를 필드별로 설정
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !email) return;

    // 폼 검증 트리거
    const isCodeValid = await trigger('verificationCode');
    if (!isCodeValid) return;

    setIsVerifyingCode(true);

    try {
      await authApi.verifyEmail({
        email,
        verification_code: verificationCode,
      });

      setEmailVerified(true);
      showSuccess(
        t('auth.signup.emailVerifiedTitle'),
        t('auth.signup.emailVerifiedDescription'),
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.signup.verificationFailedTitle'),
        t('auth.signup.verificationFailedDescription'),
        setError,
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleNicknameCheck = async () => {
    if (!nickname) return;

    // 폼 검증 트리거
    const isNicknameValid = await trigger('nickname');
    if (!isNicknameValid) return;

    try {
      const response = await authApi.checkNickname(nickname);

      const responseData = response.data as NicknameAvailabilityResponse;

      if (responseData.available) {
        setNicknameChecked(true);
        showSuccess(
          t('auth.signup.nicknameAvailableTitle'),
          t('auth.signup.nicknameAvailableDescription'),
        );
      } else {
        handleApiError(
          new Error(t('auth.signup.nicknameUnavailableTitle')),
          t('auth.signup.nicknameUnavailableTitle'),
          t('auth.signup.nicknameUnavailableDescription'),
          setError,
        );
      }
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.signup.nicknameCheckFailedTitle'),
        t('auth.signup.nicknameCheckFailedDescription'),
        setError,
      );
    }
  };

  // 회원가입 버튼 활성화 조건
  const isFormValid = () => {
    const hasRequiredFields = email && password && nickname;

    // verificationCode 에러를 제외한 다른 에러들만 체크
    const relevantErrors = Object.keys(errors).filter((key) => {
      // 이메일이 인증된 상태라면 verificationCode 에러는 무시
      if (emailVerified && key === 'verificationCode') {
        return false;
      }
      return true;
    });

    const hasNoRelevantErrors = relevantErrors.length === 0;
    return (
      hasRequiredFields &&
      hasNoRelevantErrors &&
      emailVerified &&
      nicknameChecked
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 회원가입 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: BRAND_COLORS.PRIMARY }}
        >
          {t('auth.signup.title')}
        </h2>
        <div
          className="mb-10 space-y-2"
          style={{ color: BRAND_COLORS.SECONDARY }}
        >
          <p className="text-base font-light tracking-wide">
            {t('auth.signup.subtitleLine1')}
          </p>
          <p className="text-base font-light tracking-wide">
            {t('auth.signup.subtitleLine2')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 이메일 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <FormInput
                type="email"
                id="email"
                {...register('email', {
                  onChange: () => {
                    resetEmailVerification();
                  },
                })}
                placeholder={t('auth.signup.emailPlaceholder')}
                error={errors.email?.message}
                required
                disabled={emailVerified || isSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={!email || emailVerified || isSendingCode}
              className="saegim-button saegim-button-small"
            >
              {isSendingCode
                ? t('auth.signup.sendingCode')
                : emailVerified
                  ? t('auth.signup.codeVerified')
                  : t('auth.signup.sendCode')}
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
                  {...register('verificationCode')}
                  placeholder={t('auth.signup.codePlaceholder', {
                    length: VALIDATION.VERIFICATION_CODE_LENGTH,
                  })}
                  error={errors.verificationCode?.message}
                  maxLength={VALIDATION.VERIFICATION_CODE_LENGTH}
                  disabled={isVerifyingCode || isSubmitting}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={
                  !verificationCode ||
                  verificationCode.length !==
                    VALIDATION.VERIFICATION_CODE_LENGTH ||
                  isVerifyingCode
                }
                className="saegim-button saegim-button-small"
              >
                {isVerifyingCode
                  ? t('auth.signup.verifying')
                  : t('auth.signup.verify')}
              </button>
            </div>
            <p className={`text-sm ${TEXT_STYLES.secondary}`}>
              {t('auth.signup.codeHelper', {
                length: VALIDATION.VERIFICATION_CODE_LENGTH,
              })}
            </p>
          </div>
        )}

        {/* 비밀번호 입력 */}
        <FormInput
          type="password"
          id="password"
          {...register('password')}
          placeholder={t('auth.signup.passwordPlaceholder', {
            min: VALIDATION.PASSWORD_MIN_LENGTH,
          })}
          error={errors.password?.message}
          required
          disabled={isSubmitting}
        />

        {/* 비밀번호 확인 */}
        <FormInput
          type="password"
          id="passwordConfirm"
          {...register('passwordConfirm')}
          placeholder={t('auth.signup.passwordConfirmPlaceholder')}
          error={errors.passwordConfirm?.message}
          required
          disabled={isSubmitting}
        />

        {/* 닉네임 입력 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <FormInput
                type="text"
                id="nickname"
                {...register('nickname', {
                  onChange: () => {
                    resetNicknameCheck();
                  },
                })}
                maxLength={VALIDATION.NICKNAME_MAX_LENGTH}
                placeholder={t('auth.signup.nicknamePlaceholder', {
                  min: VALIDATION.NICKNAME_MIN_LENGTH,
                  max: VALIDATION.NICKNAME_MAX_LENGTH,
                })}
                error={errors.nickname?.message}
                required
                disabled={nicknameChecked || isSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={handleNicknameCheck}
              disabled={!nickname || nicknameChecked}
              className="saegim-button saegim-button-small"
            >
              {nicknameChecked
                ? t('auth.signup.nicknameChecked')
                : t('auth.signup.nicknameCheck')}
            </button>
          </div>
        </div>

        {/* 회원가입하기 버튼 */}
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className="w-full text-white dark:text-text-dark-on-color py-3 px-4 rounded-lg hover:opacity-90 active:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base tracking-wide shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary"
          style={{ backgroundColor: '#5C8D89' }}
        >
          {isSubmitting ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </button>
      </form>
    </div>
  );
}
