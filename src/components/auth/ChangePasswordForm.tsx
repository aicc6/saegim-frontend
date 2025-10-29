'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api/client';
import { useApiError } from '@/hooks/use-api-error';
import { FormInput } from '@/components/ui/form-input';
import {
  createChangePasswordSchema,
  type ChangePasswordFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  [key: string]: unknown;
}

export default function ChangePasswordForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ChangePasswordForm',
  });

  const schema = useMemo(() => createChangePasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      // API 호출
      const requestData: ChangePasswordRequest = {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      };
      await apiClient.post('/api/auth/change-password', requestData);

      // 성공 처리
      showSuccess(
        '🔐 비밀번호 변경 성공',
        '비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요.',
      );

      // 로그아웃 처리
      await apiClient.post('/api/auth/logout', {});

      // 로그인 페이지로 리다이렉트 (보안상 필요)
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      handleApiError(
        error,
        '비밀번호 변경 실패',
        '비밀번호 변경 중 오류가 발생했습니다.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className={TEXT_STYLES.heading.h1}>비밀번호 변경</h1>
        <p className={TEXT_STYLES.description}>
          계정 보안을 위한 비밀번호를 변경합니다
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 현재 비밀번호 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="currentPassword">
            현재 비밀번호 입력
          </label>
          <FormInput
            type="password"
            id="currentPassword"
            {...register('currentPassword')}
            placeholder="현재 비밀번호를 입력하세요"
            error={errors.currentPassword?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 새 비밀번호 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="newPassword">
            새 비밀번호 입력
          </label>
          <FormInput
            type="password"
            id="newPassword"
            {...register('newPassword')}
            placeholder="새 비밀번호를 입력하세요"
            error={errors.newPassword?.message}
            disabled={isSubmitting}
          />
          <p className={`mt-1 ${TEXT_STYLES.help}`}>
            9자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.
          </p>
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="newPasswordConfirm">
            새 비밀번호 확인
          </label>
          <FormInput
            type="password"
            id="newPasswordConfirm"
            {...register('newPasswordConfirm')}
            placeholder="새 비밀번호를 다시 입력하세요"
            error={errors.newPasswordConfirm?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 비밀번호 변경 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}
