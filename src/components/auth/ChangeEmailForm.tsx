'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { apiClient } from '@/lib/api/client';
import { changeEmailSchema, type ChangeEmailFormData } from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function ChangeEmailForm() {
  const [isVerified, setIsVerified] = useState(false);
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'ChangeEmailForm',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    mode: 'onBlur',
    defaultValues: {
      nickname: '새김사용자',
      newEmail: 'user@saegim.com',
    },
  });

  const handlePasswordVerify = async () => {
    const currentPassword = getValues('currentPassword');
    if (!currentPassword) return;

    try {
      // 비밀번호 확인 API 호출
      await apiClient.post('/api/auth/verify-password', {
        current_password: currentPassword,
      });

      setIsVerified(true);
      showSuccess('비밀번호 확인 완료', '프로필을 수정할 수 있습니다.');
    } catch (error: unknown) {
      handleApiError(
        error,
        '비밀번호 확인 실패',
        '현재 비밀번호가 올바르지 않습니다.',
      );
    }
  };

  const onSubmit = async (data: ChangeEmailFormData) => {
    try {
      // 프로필 업데이트 API 호출
      await apiClient.put('/api/auth/profile', {
        nickname: data.nickname,
        email: data.newEmail,
      });

      showSuccess(
        '프로필 업데이트 완료',
        '프로필이 성공적으로 업데이트되었습니다.',
      );
    } catch (error: unknown) {
      handleApiError(
        error,
        '프로필 업데이트 실패',
        '프로필 업데이트 중 오류가 발생했습니다.',
      );
    }
  };

  return (
    <div className="space-y-6">
      {!isVerified ? (
        // 비밀번호 확인 단계
        <>
          <div className="text-center">
            <h1 className={TEXT_STYLES.heading.h1}>현재 비밀번호 입력</h1>
            <p className={TEXT_STYLES.description}>
              프로필을 변경하기 위해 현재 비밀번호를 입력해주세요
            </p>
          </div>

          <div>
            <FormInput
              type="password"
              {...register('currentPassword')}
              placeholder="현재 비밀번호를 입력하세요"
              error={errors.currentPassword?.message}
              disabled={isSubmitting}
            />
          </div>

          <Button onClick={handlePasswordVerify} className="w-full" size="lg">
            확인
          </Button>
        </>
      ) : (
        // 프로필 업데이트 폼
        <>
          <div className="text-center">
            <h1 className={TEXT_STYLES.heading.h1}>프로필 업데이트</h1>
            <p className={TEXT_STYLES.description}>
              닉네임과 이메일 정보를 변경할 수 있습니다
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 닉네임 입력 */}
            <div>
              <label className={TEXT_STYLES.label} htmlFor="nickname">
                닉네임 입력
              </label>
              <FormInput
                type="text"
                {...register('nickname')}
                placeholder="닉네임을 입력하세요"
                error={errors.nickname?.message}
                disabled={isSubmitting}
              />
            </div>

            {/* 이메일 입력 */}
            <div>
              <label className={TEXT_STYLES.label} htmlFor="newEmail">
                새 이메일 주소
              </label>
              <FormInput
                type="email"
                {...register('newEmail')}
                placeholder="새 이메일을 입력하세요"
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
              {isSubmitting ? '업데이트 중...' : '프로필 업데이트'}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
