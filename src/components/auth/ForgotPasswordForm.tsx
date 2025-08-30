'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { useApiError } from '@/hooks/use-api-error';
import { FormInput } from '@/components/ui/form-input';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ForgotPasswordForm',
    socialAccountRedirectPath: '/error/reset-password',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // 비밀번호 재설정 이메일 발송
      await authApi.sendPasswordResetEmail({ email: data.email });

      // 이메일 발송 성공 시 토스트 메시지 표시
      showSuccess(
        '📧 비밀번호 재설정 이메일 발송 완료!',
        `${data.email}로 비밀번호 재설정 링크를 발송했습니다.\n\n이메일을 확인하여 링크를 클릭해주세요.`,
        5000,
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        '이메일 발송 실패',
        '이메일 발송 중 오류가 발생했습니다.',
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
            🔐 비밀번호 찾기
          </h1>
          <p className={TEXT_STYLES.secondary}>
            가입한 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 발송해드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className={TEXT_STYLES.label}>
              이메일 주소
            </label>
            <FormInput
              type="email"
              id="email"
              {...register('email')}
              placeholder="example@email.com"
              error={errors.email?.message}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full saegim-button saegim-button-large"
          >
            {isSubmitting ? '발송 중...' : '비밀번호 재설정 이메일 발송'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGoToLogin}
            className={TEXT_STYLES.link}
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
