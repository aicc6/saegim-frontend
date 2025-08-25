'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      toast({
        title: '오류',
        description: '이메일을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: '오류',
        description: '올바른 이메일 형식을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // 비밀번호 재설정 이메일 발송
      const response = await authApi.sendPasswordResetEmail({ email });

      console.log('API 응답:', response);
      console.log('응답 데이터:', response.data);

      // 이메일 발송 성공 시 토스트 메시지 표시
      toast({
        title: '📧 비밀번호 재설정 이메일 발송 완료!',
        description: `${email}로 비밀번호 재설정 링크를 발송했습니다.\n\n이메일을 확인하여 링크를 클릭해주세요.`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('비밀번호 재설정 이메일 발송 실패:', error);
      const errorMsg =
        error.response?.data?.detail || '이메일 발송에 실패했습니다.';

      console.log('에러 메시지:', errorMsg);
      console.log('에러 응답:', error.response?.data);

      // 소셜 계정 사용자인 경우 에러 페이지로 리다이렉트
      if (
        errorMsg.includes('소셜 계정 사용자입니다') ||
        errorMsg.includes('소셜 계정') ||
        errorMsg.includes('social account') ||
        errorMsg.includes('Google') ||
        errorMsg.includes('Google 계정') ||
        errorMsg.includes('계정으로 가입된 사용자')
      ) {
        console.log('소셜 계정 감지됨, 에러 페이지로 리다이렉트');
        console.log('감지된 에러 메시지:', errorMsg);
        router.push('/error/reset-password');
        return;
      }

      if (
        errorMsg.includes('존재하지 않는') ||
        errorMsg.includes('가입되지 않은')
      ) {
        toast({
          title: '계정 없음',
          description:
            '해당 이메일로 가입된 계정이 없습니다. 회원가입을 먼저 진행해주세요.',
          variant: 'destructive',
        });
      } else if (
        errorMsg.includes('이메일 발송에 실패했습니다') ||
        errorMsg.includes('이메일 발송 중 오류가 발생했습니다')
      ) {
        toast({
          title: '이메일 발송 실패',
          description:
            '이메일 발송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '오류',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background-primary dark:bg-background-dark-secondary rounded-2xl shadow-2xl p-8 border border-border-subtle dark:border-border-dark">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-dark mb-2">
            🔐 비밀번호 찾기
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary">
            가입한 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 발송해드립니다.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendResetEmail();
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            >
              이메일 주소
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
              placeholder="example@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full saegim-button saegim-button-large"
          >
            {isLoading ? '발송 중...' : '비밀번호 재설정 이메일 발송'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="text-sm text-sage-50 dark:text-sage-40 hover:text-sage-60 dark:hover:text-sage-30 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
