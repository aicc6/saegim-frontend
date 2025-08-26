'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function RestoreAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSendRestoreEmail = async () => {
    if (!email.trim()) {
      toast({
        title: '입력 오류',
        description: '이메일 주소를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authApi.sendRestoreEmail(email);
      
      setIsCodeSent(true);
      toast({
        title: '복구 이메일 발송 완료',
        description: '입력한 이메일로 복구 인증 코드를 발송했습니다.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('복구 이메일 발송 실패:', error);
      
      let errorMessage = '복구 이메일 발송에 실패했습니다.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: '발송 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreAccount = async () => {
    if (!email.trim() || !verificationCode.trim()) {
      toast({
        title: '입력 오류',
        description: '이메일과 인증 코드를 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authApi.restoreAccount({
        email: email,
        verification_code: verificationCode,
      });
      
      toast({
        title: '계정 복구 완료',
        description: '계정이 성공적으로 복구되었습니다. 다시 로그인해주세요.',
        variant: 'default',
      });
      
      // 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('계정 복구 실패:', error);
      
      let errorMessage = '계정 복구에 실패했습니다.';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: '복구 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary dark:text-text-dark">
            🔄 계정 복구
          </h2>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary">
            탈퇴된 계정을 복구할 수 있습니다.
          </p>
          {searchParams.get('message') && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {searchParams.get('message')}
              </p>
              {searchParams.get('days_remaining') && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  남은 복구 기간: {searchParams.get('days_remaining')}일
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-background-secondary dark:bg-background-dark-secondary rounded-lg shadow-sm border border-border-subtle dark:border-border-dark p-6">
          <div className="space-y-6">
            {/* 이메일 입력 */}
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
                placeholder="탈퇴한 계정의 이메일을 입력하세요"
                disabled={isCodeSent}
              />
            </div>

            {/* 인증 코드 발송 버튼 */}
            {!isCodeSent && (
              <button
                onClick={handleSendRestoreEmail}
                disabled={isLoading || !email.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '발송 중...' : '복구 이메일 발송'}
              </button>
            )}

            {/* 인증 코드 입력 */}
            {isCodeSent && (
              <>
                <div>
                  <label
                    htmlFor="verificationCode"
                    className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
                  >
                    인증 코드
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-background-dark-tertiary border border-gray-300 dark:border-border-dark-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:border-sage-50 dark:focus:border-border-dark-focus text-gray-900 dark:text-text-dark-primary placeholder-gray-500 dark:placeholder-text-dark-placeholder transition-all duration-200"
                    placeholder="이메일로 받은 6자리 인증 코드를 입력하세요"
                  />
                </div>

                <button
                  onClick={handleRestoreAccount}
                  disabled={isLoading || !verificationCode.trim()}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '복구 중...' : '계정 복구하기'}
                </button>
              </>
            )}

            {/* 다시 발송 버튼 */}
            {isCodeSent && (
              <button
                onClick={handleSendRestoreEmail}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '발송 중...' : '인증 코드 다시 발송'}
              </button>
            )}

            {/* 로그인 페이지로 돌아가기 */}
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                로그인 페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
