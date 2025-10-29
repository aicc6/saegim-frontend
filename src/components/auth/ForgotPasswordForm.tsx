'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { authApi } from '@/lib/api/auth';
import { useApiError } from '@/hooks/use-api-error';
import { FormInput } from '@/components/ui/form-input';
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ForgotPasswordForm',
    socialAccountRedirectPath: '/error/reset-password',
  });

  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // 비밀번호 재설정 이메일 발송
      await authApi.sendPasswordResetEmail({ email: data.email });

      // 이메일 발송 성공 시 토스트 메시지 표시
      showSuccess(
        t('auth.forgotPasswordForm.toastTitle'),
        t('auth.forgotPasswordForm.toastDescription', { email: data.email }),
        5000,
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.forgotPasswordForm.toastErrorTitle'),
        t('auth.forgotPasswordForm.toastErrorDescription'),
      );
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${TEXT_STYLES.primary} mb-2`}>
            {t('auth.forgotPasswordForm.title')}
          </h1>
          <p className={TEXT_STYLES.secondary}>
            {t('auth.forgotPasswordForm.descriptionLine1')}
            <br />
            {t('auth.forgotPasswordForm.descriptionLine2')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className={TEXT_STYLES.label}>
              {t('auth.forgotPasswordForm.emailLabel')}
            </label>
            <FormInput
              type="email"
              id="email"
              {...register('email')}
              placeholder={t('auth.forgotPasswordForm.emailPlaceholder')}
              error={errors.email?.message}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full saegim-button saegim-button-large"
          >
            {isSubmitting
              ? t('auth.forgotPasswordForm.submitLoading')
              : t('auth.forgotPasswordForm.submit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGoToLogin}
            className={TEXT_STYLES.link}
          >
            {t('auth.forgotPasswordForm.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
