'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { authApi } from '@/lib/api/auth';
import { BRAND_COLORS, VALIDATION, TEXT_STYLES } from '@/constants';
import { signupSchema, type SignupFormData } from '@/schemas/auth';
import { NicknameAvailabilityResponse } from '@/types/api';
import { getLogger } from '@/lib/logger';

export default function SignupForm() {
  const router = useRouter();
  const logger = getLogger('SignupForm');
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'SignupForm',
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    trigger,
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
        new Error('입력 확인 필요'),
        '입력 확인 필요',
        '이메일 인증과 닉네임 중복 확인을 완료해주세요.',
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

      showSuccess('회원가입 성공', '새김에 가입해주셔서 감사합니다!');
      router.push('/login');
    } catch (error: unknown) {
      logger.error('🚨 회원가입 에러 발생', { error });
      handleApiError(
        error,
        '회원가입 실패',
        '회원가입 중 오류가 발생했습니다.',
        setError, // 서버 검증 에러를 필드별로 설정
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
          new Error('이메일 중복'),
          '이메일 사용 불가',
          '이미 사용 중인 이메일입니다.',
        );
        return;
      }

      // 인증 코드 발송
      await authApi.sendVerificationEmail({ email });

      setCodeSent(true);
      showSuccess('인증 코드 발송', '이메일로 인증 코드가 발송되었습니다.');
    } catch (error: unknown) {
      handleApiError(
        error,
        '인증 코드 발송 실패',
        '인증 코드 발송 중 오류가 발생했습니다.',
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
      showSuccess('이메일 인증 완료', '이메일 인증이 완료되었습니다.');
    } catch (error: unknown) {
      handleApiError(
        error,
        '인증 실패',
        '인증 코드가 올바르지 않습니다.',
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
        showSuccess('닉네임 확인 완료', '사용 가능한 닉네임입니다.');
      } else {
        handleApiError(
          new Error('닉네임 중복'),
          '닉네임 사용 불가',
          '이미 사용 중인 닉네임입니다.',
          setError,
        );
      }
    } catch (error: unknown) {
      handleApiError(
        error,
        '닉네임 확인 실패',
        '닉네임 확인 중 오류가 발생했습니다.',
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
                placeholder="이메일 입력"
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
                  {...register('verificationCode')}
                  placeholder={`인증 코드 ${VALIDATION.VERIFICATION_CODE_LENGTH}자리 입력`}
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
                {isVerifyingCode ? '확인중...' : '확인'}
              </button>
            </div>
            <p className={`text-sm ${TEXT_STYLES.secondary}`}>
              이메일로 발송된 6자리 인증 코드를 입력해주세요.
            </p>
          </div>
        )}

        {/* 비밀번호 입력 */}
        <FormInput
          type="password"
          id="password"
          {...register('password')}
          placeholder={`비밀번호 입력 (영문, 숫자, 특수문자 포함 9자 이상)`}
          error={errors.password?.message}
          required
          disabled={isSubmitting}
        />

        {/* 비밀번호 확인 */}
        <FormInput
          type="password"
          id="passwordConfirm"
          {...register('passwordConfirm')}
          placeholder="비밀번호 확인"
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
                placeholder={`닉네임 입력 (${VALIDATION.NICKNAME_MIN_LENGTH}-${VALIDATION.NICKNAME_MAX_LENGTH}자, 한글/영문만)`}
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
              {nicknameChecked ? '확인완료' : '중복확인'}
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
          {isSubmitting ? '회원가입 중...' : '회원가입하기'}
        </button>
      </form>
    </div>
  );
}
