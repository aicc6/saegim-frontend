'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api/auth';
import { useApiError } from '@/hooks/use-api-error';
import { FormInput } from '@/components/ui/form-input';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ResetPasswordForm',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  // URL에서 이메일과 인증 코드 추출
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');

    // 필요한 파라미터가 없으면 비밀번호 찾기 페이지로 리다이렉트
    if (!emailParam || !codeParam) {
      handleApiError(
        new Error('잘못된 접근'),
        '잘못된 접근',
        '비밀번호 재설정 링크가 올바르지 않습니다.',
      );
      router.push('/forgot-password');
    }
  }, [searchParams, router, handleApiError]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');

    if (!emailParam || !codeParam) {
      handleApiError(
        new Error('필수 정보 누락'),
        '오류',
        '필요한 정보가 없습니다. 다시 시도해주세요.',
      );
      router.push('/forgot-password');
      return;
    }

    try {
      await authApi.resetPassword({
        email: decodeURIComponent(emailParam),
        verification_code: decodeURIComponent(codeParam),
        new_password: data.password,
      });

      showSuccess(
        '🔐 비밀번호 변경 완료',
        '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
        5000,
      );

      // 로그인 페이지로 리다이렉트
      router.push('/login?message=password_changed');
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
      {/* 성공 아이콘 */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-sage-50/20 dark:bg-sage-50/10 rounded-full flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label="이메일">
            ✉️
          </span>
        </div>
      </div>

      <div className="text-center">
        <h1 className={TEXT_STYLES.heading.h1}>비밀번호 재설정</h1>
        <p className={TEXT_STYLES.description}>
          새로운 비밀번호를 입력해주세요
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 새 비밀번호 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="password">
            새 비밀번호 입력
          </label>
          <FormInput
            type="password"
            id="password"
            {...register('password')}
            placeholder="새 비밀번호를 입력하세요"
            error={errors.password?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="passwordConfirm">
            새 비밀번호 확인
          </label>
          <FormInput
            type="password"
            id="passwordConfirm"
            {...register('passwordConfirm')}
            placeholder="새 비밀번호를 다시 입력하세요"
            error={errors.passwordConfirm?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 비밀번호 보안 요구사항 안내 */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <h3 className={`text-sm font-medium ${TEXT_STYLES.info.blue} mb-2`}>
            비밀번호 요구사항
          </h3>
          <ul className={`text-xs ${TEXT_STYLES.info.blueSecondary} space-y-1`}>
            <li>• 9자 이상</li>
            <li>• 영문, 숫자, 특수문자 포함</li>
          </ul>
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

      {/* 로그인 페이지로 돌아가기 */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={TEXT_STYLES.link}
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
