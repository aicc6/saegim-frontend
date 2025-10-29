'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { apiClient } from '@/lib/api/client';
import {
  createChangeEmailSchema,
  type ChangeEmailFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ChangeEmailForm() {
  const [isVerified, setIsVerified] = useState(false);
  const { t } = useTranslation();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ChangeEmailForm',
  });

  const schema = useMemo(() => createChangeEmailSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      nickname: '',
      newEmail: '',
    },
  });

  const handlePasswordVerify = async () => {
    const currentPassword = getValues('currentPassword');
    if (!currentPassword) return;

    try {
      await apiClient.post('/api/auth/verify-password', {
        current_password: currentPassword,
      });

      setIsVerified(true);
      showSuccess(
        t('auth.changeEmail.verifySuccessTitle'),
        t('auth.changeEmail.verifySuccessDescription'),
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.changeEmail.verifyFailureTitle'),
        t('auth.changeEmail.verifyFailureDescription'),
      );
    }
  };

  const onSubmit = async (data: ChangeEmailFormData) => {
    try {
      await apiClient.put('/api/auth/profile', {
        nickname: data.nickname,
        email: data.newEmail,
      });

      showSuccess(
        t('auth.changeEmail.successTitle'),
        t('auth.changeEmail.successDescription'),
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        t('auth.changeEmail.failureTitle'),
        t('auth.changeEmail.failureDescription'),
      );
    }
  };

  return (
    <div className="space-y-6">
      {!isVerified ? (
        // 비밀번호 확인 단계
        <>
          <div className="text-center">
            <h1 className={TEXT_STYLES.heading.h1}>
              {t('auth.changeEmail.verifyTitle')}
            </h1>
            <p className={TEXT_STYLES.description}>
              {t('auth.changeEmail.verifyDescription')}
            </p>
          </div>

          <div>
            <FormInput
              type="password"
              {...register('currentPassword')}
              placeholder={t('auth.changeEmail.verifyPlaceholder')}
              error={errors.currentPassword?.message}
              disabled={isSubmitting}
            />
          </div>

          <Button onClick={handlePasswordVerify} className="w-full" size="lg">
            {t('auth.changeEmail.verifyButton')}
          </Button>
        </>
      ) : (
        // 프로필 업데이트 폼
        <>
          <div className="text-center">
            <h1 className={TEXT_STYLES.heading.h1}>
              {t('auth.changeEmail.formTitle')}
            </h1>
            <p className={TEXT_STYLES.description}>
              {t('auth.changeEmail.formDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 닉네임 입력 */}
            <div>
              <label className={TEXT_STYLES.label} htmlFor="nickname">
                {t('auth.changeEmail.nicknameLabel')}
              </label>
              <FormInput
                type="text"
                {...register('nickname')}
                placeholder={t('auth.changeEmail.nicknamePlaceholder')}
                error={errors.nickname?.message}
                disabled={isSubmitting}
              />
            </div>

            {/* 이메일 입력 */}
            <div>
              <label className={TEXT_STYLES.label} htmlFor="newEmail">
                {t('auth.changeEmail.emailLabel')}
              </label>
              <FormInput
                type="email"
                {...register('newEmail')}
                placeholder={t('auth.changeEmail.emailPlaceholder')}
                error={errors.newEmail?.message}
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('auth.changeEmail.submittingLabel')
                : t('auth.changeEmail.submitLabel')}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
