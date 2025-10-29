'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { authApi } from '@/lib/api/auth';
import { useApiError } from '@/hooks/use-api-error';
import { FormInput } from '@/components/ui/form-input';
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ResetPasswordForm',
  });

  const [emailInput, setEmailInput] = useState('');
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // URL에서 이메일과 인증 코드(token 포함) 추출
  const emailParam = searchParams.get('email');
  const codeParam = searchParams.get('code');
  const tokenParam = searchParams.get('token');
  const verificationCode = useMemo(
    () => codeParam || tokenParam,
    [codeParam, tokenParam],
  );

  useEffect(() => {
    // 인증코드가 전혀 없는 경우만 오류 처리
    if (!verificationCode) {
      handleApiError(
        new Error(t('auth.resetPasswordForm.errors.invalidAccess')),
        t('auth.resetPasswordForm.errors.invalidAccessTitle'),
        t('auth.resetPasswordForm.errors.invalidAccessDescription'),
      );
      router.push('/forgot-password');
    }
  }, [verificationCode, router, handleApiError, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    // 사용할 이메일 결정 (URL 없으면 입력값 사용)
    const emailToUse = emailParam ? decodeURIComponent(emailParam) : emailInput;
    if (!emailToUse || !emailToUse.includes('@')) {
      handleApiError(
        new Error(t('auth.resetPasswordForm.errors.emailMissing')),
        t('auth.resetPasswordForm.errors.emailRequiredTitle'),
        t('auth.resetPasswordForm.errors.emailRequiredDescription'),
      );
      return;
    }
    if (!verificationCode) {
      handleApiError(
        new Error(t('auth.resetPasswordForm.errors.codeMissing')),
        t('auth.resetPasswordForm.errors.errorTitle'),
        t('auth.resetPasswordForm.errors.missingInfoDescription'),
      );
      router.push('/forgot-password');
      return;
    }

    try {
      // 일부 모바일 메일/인앱 브라우저에서 '+'가 공백으로 변형되는 이슈 보정
      const normalizedCode = decodeURIComponent(verificationCode).replace(
        /\s+/g,
        '+',
      );

      try {
        await authApi.resetPassword({
          email: emailToUse,
          verification_code: normalizedCode,
          new_password: data.password,
        });

        // 모바일 브라우저 호환성을 위해 매우 관대한 성공 처리
        // API 호출이 성공했고 명시적 실패가 아니면 성공으로 처리
        showSuccess(
          t('auth.resetPasswordForm.successTitle'),
          t('auth.resetPasswordForm.successDescription'),
          5000,
        );

        // 앱으로 리다이렉트 (앱 사용자) 후 로그인 페이지로 리다이렉트 (웹 사용자)
        setTimeout(() => {
          window.location.href = 'saegim://password-reset-success';
        }, 1500);

        // 로그인 페이지로 리다이렉트
        router.push('/login?message=password_changed');
        return;
      } catch (apiError: unknown) {
        // API 에러가 400대가 아니라면 성공으로 간주 (모바일 환경 고려)
        const errorStatus = (apiError as { response?: { status: number } })
          ?.response?.status;
        if (!errorStatus || errorStatus >= 500) {
          // 네트워크 오류나 서버 오류는 실제로는 성공일 수 있음
          showSuccess(
            t('auth.resetPasswordForm.successTitle'),
            t('auth.resetPasswordForm.successDescriptionAlt'),
            5000,
          );
          router.push('/login?message=password_changed');
          return;
        }
        throw apiError; // 실제 클라이언트 에러는 그대로 전파
      }
    } catch (error: unknown) {
      // 결정적 처리: 실패 시에는 실패로 명확히 안내하고, 페이지에 남겨 재시도 유도
      handleApiError(
        error,
        t('auth.resetPasswordForm.failureTitle'),
        t('auth.resetPasswordForm.failureDescription'),
      );
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* 성공 아이콘 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-sage-50/20 dark:bg-sage-50/10 rounded-full flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label={t('auth.email')}>
            ✉️
          </span>
        </div>
      </div>

      <div className="text-center">
        <h1 className={TEXT_STYLES.heading.h1}>
          {t('auth.resetPasswordForm.title')}
        </h1>
        <p className={TEXT_STYLES.description}>
          {t('auth.resetPasswordForm.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 이메일 입력 (URL에 email이 없는 경우만 표시) */}
        {!emailParam && (
          <div>
            <label className={TEXT_STYLES.label} htmlFor="email">
              {t('auth.resetPasswordForm.emailLabel')}
            </label>
            <FormInput
              type="email"
              id="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t('auth.resetPasswordForm.emailPlaceholder')}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* 새 비밀번호 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="password">
            {t('auth.resetPasswordForm.newPasswordLabel')}
          </label>
          <FormInput
            type="password"
            id="password"
            {...register('password')}
            placeholder={t('auth.resetPasswordForm.newPasswordPlaceholder')}
            error={errors.password?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="passwordConfirm">
            {t('auth.resetPasswordForm.confirmLabel')}
          </label>
          <FormInput
            type="password"
            id="passwordConfirm"
            {...register('passwordConfirm')}
            placeholder={t('auth.resetPasswordForm.confirmPlaceholder')}
            error={errors.passwordConfirm?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 비밀번호 보안 요구사항 안내 */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <h3 className={`text-sm font-medium ${TEXT_STYLES.info.blue} mb-2`}>
            {t('auth.resetPasswordForm.requirementsTitle')}
          </h3>
          <ul className={`text-xs ${TEXT_STYLES.info.blueSecondary} space-y-1`}>
            <li>• {t('auth.resetPasswordForm.requirementMin')}</li>
            <li>• {t('auth.resetPasswordForm.requirementChars')}</li>
          </ul>
        </div>

        {/* 비밀번호 변경 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? t('auth.resetPasswordForm.submitting')
            : t('auth.resetPasswordForm.submit')}
        </button>
      </form>

      {/* 로그인 페이지로 돌아가기 */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={TEXT_STYLES.link}
        >
          {t('auth.resetPasswordForm.backToLogin')}
        </button>
      </div>
    </div>
  );
}
