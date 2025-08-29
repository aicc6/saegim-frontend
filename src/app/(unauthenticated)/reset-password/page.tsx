'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // URL에서 토큰 파라미터 가져오기
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('유효하지 않은 링크입니다.');
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 9) {
      return '비밀번호는 9자 이상이어야 합니다.';
    }

    // 영문, 숫자, 특수문자 포함 검증
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;
    if (!passwordRegex.test(password)) {
      return '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 이메일 검증
    if (!email || !email.includes('@')) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    // 비밀번호 검증
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 비밀번호 확인
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 비밀번호 재설정 API 호출
      const response = await apiClient.post('/auth/forgot-password/reset', {
        email: email,
        verification_code: token,
        new_password: newPassword,
      });

      if (
        response.data &&
        typeof response.data === 'object' &&
        'success' in response.data
      ) {
        toast({
          title: '✅ 비밀번호 변경 완료!',
          description:
            '비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.',
          duration: 3000,
        });

        // 로그인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: unknown) {
      logger.error('비밀번호 재설정 오류:', error);

      const apiError = error as { response?: { data?: { detail?: string } } };
      if (apiError.response?.data?.detail) {
        setError(apiError.response.data.detail);
      } else {
        setError('비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600 text-2xl">⚠️ 오류</CardTitle>
            <CardDescription className="text-lg">
              유효하지 않은 링크입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full saegim-button saegim-button-large"
            >
              비밀번호 찾기로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4 bg-background-primary dark:bg-background-dark-secondary border border-border-subtle dark:border-border-dark shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-text-primary dark:text-text-dark mb-2">
            🔐 새 비밀번호 설정
          </CardTitle>
          <CardDescription className="text-text-secondary dark:text-text-dark-secondary text-base">
            새로운 비밀번호를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-text-primary dark:text-text-dark font-medium"
              >
                이메일 주소
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입한 이메일 주소를 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-text-primary dark:text-text-dark font-medium"
              >
                새 비밀번호
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                영문, 숫자, 특수문자를 포함하여 9자 이상
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-text-primary dark:text-text-dark font-medium"
              >
                새 비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
              />
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 dark:bg-red-900/20"
              >
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full saegim-button saegim-button-large"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '비밀번호 변경'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => router.push('/login')}
              className="text-sm text-sage-50 dark:text-sage-40 hover:text-sage-60 dark:hover:text-sage-30 transition-colors"
            >
              로그인 페이지로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로딩 중...</CardTitle>
          <CardDescription>잠시만 기다려주세요.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
