'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // URL에서 이메일과 인증 코드 추출
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (codeParam) {
      setVerificationCode(decodeURIComponent(codeParam));
    }

    // 필요한 파라미터가 없으면 비밀번호 찾기 페이지로 리다이렉트
    if (!emailParam || !codeParam) {
      toast({
        title: '잘못된 접근',
        description: '비밀번호 재설정 링크가 올바르지 않습니다.',
        variant: 'destructive',
      });
      router.push('/forgot-password');
    }
  }, [searchParams, router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return '비밀번호는 영문자와 숫자를 모두 포함해야 합니다.';
    }
    return null;
  };

  const handlePasswordChange = async () => {
    if (!email || !verificationCode) {
      toast({
        title: '오류',
        description: '필요한 정보가 없습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
      router.push('/forgot-password');
      return;
    }

    // 비밀번호 유효성 검증
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast({
        title: '비밀번호 오류',
        description: passwordError,
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: '비밀번호 불일치',
        description: '입력한 비밀번호가 일치하지 않습니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      await authApi.resetPassword({
        email,
        verification_code: verificationCode,
        new_password: passwordData.newPassword,
      });

      toast({
        title: '비밀번호 변경 완료',
        description:
          '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
        duration: 5000,
      });

      // 로그인 페이지로 리다이렉트
      router.push('/login?message=password_changed');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      const errorMessage =
        apiError.response?.data?.detail ||
        '비밀번호 변경 중 오류가 발생했습니다.';

      toast({
        title: '비밀번호 변경 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          비밀번호 재설정
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          새로운 비밀번호를 입력해주세요
        </p>
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
          id="newPassword"
          value={passwordData.newPassword}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
          placeholder="새 비밀번호를 입력하세요"
        />
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
          id="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
          placeholder="새 비밀번호를 다시 입력하세요"
        />
      </div>

      {/* 비밀번호 보안 요구사항 안내 */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          비밀번호 요구사항
        </h3>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 8자 이상</li>
          <li>• 영문자와 숫자 포함</li>
          <li>• 특수문자 사용 권장</li>
        </ul>
      </div>

      {/* 비밀번호 변경 버튼 */}
      <button
        onClick={handlePasswordChange}
        disabled={
          isLoading ||
          !passwordData.newPassword ||
          !passwordData.confirmPassword
        }
        className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '변경 중...' : '비밀번호 변경'}
      </button>

      {/* 로그인 페이지로 돌아가기 */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-sm text-sage-50 dark:text-sage-40 hover:text-sage-60 dark:hover:text-sage-30 transition-colors"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}
