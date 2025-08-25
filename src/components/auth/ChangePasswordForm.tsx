'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  [key: string]: unknown;
}

export default function ChangePasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string): boolean => {
    // 비밀번호 정책: 9자 이상, 영문+숫자+특수문자
    const minLength = password.length >= 9;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

    return minLength && hasLetter && hasNumber && hasSpecial;
  };

  const handlePasswordChange = async () => {
    try {
      setIsLoading(true);

      // 1. 입력값 검증
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        toast({
          title: '입력 오류',
          description: '모든 필드를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      // 2. 새 비밀번호 정책 검증
      if (!validatePassword(passwordData.newPassword)) {
        toast({
          title: '비밀번호 정책 오류',
          description:
            '비밀번호는 9자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 3. 새 비밀번호 확인
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: '비밀번호 불일치',
          description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 4. 현재 비밀번호와 새 비밀번호가 같은지 확인
      if (passwordData.currentPassword === passwordData.newPassword) {
        toast({
          title: '비밀번호 오류',
          description: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 5. API 호출
      const requestData: ChangePasswordRequest = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      };

      const result = await apiClient.post(
        '/api/auth/change-password/',
        requestData,
      );

      // 6. 성공 처리
      toast({
        title: '비밀번호 변경 성공',
        description:
          '비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요.',
      });

      // 7. 로그아웃 처리
      await apiClient.post('/api/auth/logout', {});

      // 8. 클라이언트 상태 정리 (쿠키 기반 인증이므로 localStorage 정리 불필요)
      console.log('🧹 쿠키 기반 인증이므로 localStorage 정리 불필요');

      // 9. 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      toast({
        title: '비밀번호 변경 실패',
        description:
          error instanceof Error
            ? error.message
            : '비밀번호 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          비밀번호 변경
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          계정 보안을 위한 비밀번호를 변경합니다
        </p>
      </div>

      <div className="space-y-4">
        {/* 현재 비밀번호 입력 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="currentPassword"
          >
            현재 비밀번호 입력
          </label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="현재 비밀번호를 입력하세요"
            disabled={isLoading}
          />
        </div>

        {/* 새 비밀번호 입력 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="newPassword"
          >
            새 비밀번호 입력
          </label>
          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="새 비밀번호를 입력하세요"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
            9자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.
          </p>
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="confirmPassword"
          >
            새 비밀번호 확인
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="새 비밀번호를 다시 입력하세요"
            disabled={isLoading}
          />
        </div>

        {/* 비밀번호 변경 버튼 */}
        <Button
          onClick={handlePasswordChange}
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </div>
    </div>
  );
}
