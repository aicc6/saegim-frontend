'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const [emailInput, setEmailInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
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
        new Error('잘못된 접근'),
        '잘못된 접근',
        '비밀번호 재설정 링크가 올바르지 않습니다.',
      );
      router.push('/forgot-password');
    }
  }, [verificationCode, router, handleApiError]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    // 사용할 이메일 결정 (URL 없으면 입력값 사용)
    const emailToUse = emailParam ? decodeURIComponent(emailParam) : emailInput;
    if (!emailToUse || !emailToUse.includes('@')) {
      handleApiError(
        new Error('이메일 누락'),
        '이메일 필요',
        '유효한 이메일 주소를 입력해주세요.',
      );
      return;
    }
    if (!verificationCode) {
      handleApiError(
        new Error('인증 코드 누락'),
        '오류',
        '필요한 정보가 없습니다. 다시 시도해주세요.',
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
      const response = await authApi.resetPassword({
        email: emailToUse,
        verification_code: normalizedCode,
        new_password: data.password,
      });

      // API 응답이 성공인지 명시적으로 확인 (204 No Content나 success: true 모두 허용)
      const isSuccess = response?.success !== false; // undefined, true, null 모두 성공으로 처리

      if (isSuccess) {
        showSuccess(
          '🔐 비밀번호 변경 완료',
          '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
          5000,
        );

        // 앱으로 리다이렉트 (앱 사용자) 후 로그인 페이지로 리다이렉트 (웹 사용자)
        setTimeout(() => {
          window.location.href = 'saegim://password-reset-success';
        }, 1500);

        // 로그인 페이지로 리다이렉트
        router.push('/login?message=password_changed');
        return;
      } else {
        // 명시적으로 success: false인 경우만 실패 처리
        throw new Error('Password reset failed with success: false');
      }
    } catch (error: unknown) {
      // 결정적 처리: 실패 시에는 실패로 명확히 안내하고, 페이지에 남겨 재시도 유도
      handleApiError(
        error,
        '비밀번호 변경 실패',
        '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
      return;
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
        {/* 이메일 입력 (URL에 email이 없는 경우만 표시) */}
        {!emailParam && (
          <div>
            <label className={TEXT_STYLES.label} htmlFor="email">
              이메일 주소
            </label>
            <FormInput
              type="email"
              id="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="가입한 이메일 주소를 입력하세요"
              disabled={isSubmitting}
            />
          </div>
        )}

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
