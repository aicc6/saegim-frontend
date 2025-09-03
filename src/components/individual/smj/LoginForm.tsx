'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import GoogleLoginButton from '@/components/ui/custom/GoogleLoginButton';
import { FormInput } from '@/components/ui/form-input';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth';
import { authApi, getLogger } from '@/lib';
import { BRAND_COLORS } from '@/constants';
import { loginSchema, type LoginFormData } from '@/schemas/auth';

interface LoginFormProps {
  redirectTo?: string | null;
}

const logger = getLogger('LoginForm');

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // URL 파라미터로 전달된 에러 처리
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error && message) {
      let errorTitle = '로그인 실패';
      let errorDescription = message;

      if (error === 'account_permanently_deleted') {
        errorTitle = '영구 삭제된 계정';
        errorDescription = '탈퇴 후 30일이 경과되어 복구할 수 없습니다.';
      } else if (error === 'account_deleted') {
        errorTitle = '탈퇴된 계정';
        errorDescription =
          '탈퇴된 계정입니다. 복구 페이지에서 계정을 복구할 수 있습니다.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      // 로그인 성공 시 사용자 정보를 스토어에 저장
      const userData = response.data;
      if (userData && typeof userData === 'object' && 'user_id' in userData) {
        login({
          id: userData.user_id as string,
          email: userData.email as string,
          name: userData.nickname as string, // 백엔드에서는 nickname, 프론트엔드에서는 name
          profileImage: '',
          provider: 'email',
          createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error('잘못된 응답 형식입니다.');
      }

      toast({
        title: '로그인 성공',
        description: '새김에 오신 것을 환영합니다!',
        variant: 'default',
      });

      // 리다이렉트 경로가 있으면 해당 경로로, 없으면 메인 페이지로
      const redirectPath = redirectTo === 'records' ? '/list' : '/';
      router.push(redirectPath);
    } catch (error: unknown) {
      const errorInfo =
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : { message: '알 수 없는 오류' };

      logger.error('로그인 실패', { error, errorInfo });

      // 상세한 에러 메시지 처리
      let errorTitle = '로그인 실패';
      let errorDescription = '로그인 중 오류가 발생했습니다.';

      if (error instanceof Error && error.message) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes('401') ||
          errorMessage.includes('unauthorized')
        ) {
          errorTitle = '인증 실패';
          errorDescription = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (errorMessage.includes('password')) {
          errorTitle = '비밀번호 오류';
          errorDescription =
            '비밀번호가 변경되었을 수 있습니다. 비밀번호 찾기를 이용해주세요.';
        } else if (
          errorMessage.includes('email') ||
          errorMessage.includes('user')
        ) {
          errorTitle = '계정 오류';
          errorDescription =
            '존재하지 않는 이메일 주소입니다. 회원가입을 먼저 진행해주세요.';
        } else if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch')
        ) {
          errorTitle = '네트워크 오류';
          errorDescription =
            '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
        } else if (errorMessage.includes('timeout')) {
          errorTitle = '시간 초과';
          errorDescription =
            '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
      }

      // 백엔드에서 전달된 상세 에러 메시지가 있으면 우선 사용
      const apiError = error as {
        response?: {
          data?: { detail?: unknown };
          status?: number;
        };
      };
      if (apiError?.response?.data?.detail) {
        const backendError = apiError.response.data.detail;

        // 탈퇴된 계정 처리
        if (
          apiError.response?.status === 403 &&
          typeof backendError === 'object' &&
          backendError !== null
        ) {
          const accountError = backendError as {
            error?: string;
            restore_available?: boolean;
            days_remaining?: number;
          };
          if (
            accountError.error === 'ACCOUNT_DELETED' &&
            accountError.restore_available
          ) {
            errorTitle = '탈퇴된 계정';
            errorDescription = `탈퇴된 계정입니다. ${accountError.days_remaining}일 이내에 복구할 수 있습니다.`;

            // 복구 가능한 경우 복구 페이지로 이동 옵션 제공
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">
                    ⚠️
                  </span>
                  <span>{errorTitle}</span>
                </div>
              ),
              description: (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-sm mt-0.5">ℹ️</span>
                    <span className="text-sm">{errorDescription}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-blue-600 dark:text-blue-400 text-sm">
                        🔄
                      </span>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        계정을 복구하시겠습니까?
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
                      복구 후에도 모든 데이터가 그대로 유지됩니다.
                    </p>
                    <button
                      onClick={() => router.push('/restore-account')}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>🔄</span>
                        <span>지금 복구하기</span>
                      </span>
                    </button>
                  </div>
                </div>
              ),
              variant: 'default', // destructive에서 default로 변경하여 더 중성적인 색상 사용
              duration: 10000, // 10초로 연장하여 사용자가 충분히 읽을 수 있도록
            });
            return; // 다른 에러 처리 중단
          } else if (accountError.error === 'ACCOUNT_PERMANENTLY_DELETED') {
            errorTitle = '영구 삭제된 계정';
            errorDescription = '탈퇴 후 30일이 경과되어 복구할 수 없습니다.';

            // 영구 삭제된 계정에 대한 특별한 토스트 표시
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <span className="text-red-600 dark:text-red-400">🚫</span>
                  <span>{errorTitle}</span>
                </div>
              ),
              description: (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-sm mt-0.5">❌</span>
                    <span className="text-sm">{errorDescription}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        💡
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                        새로운 계정을 만드시겠습니까?
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-400 mb-3">
                      동일한 이메일로 새 계정을 생성할 수 있습니다.
                    </p>
                    <button
                      onClick={() => router.push('/register')}
                      className="w-full px-4 py-2.5 bg-sage-50 hover:bg-sage-60 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-sage-40 focus:ring-offset-2 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        <span>새 계정 만들기</span>
                      </span>
                    </button>
                  </div>
                </div>
              ),
              variant: 'default',
              duration: 10000,
            });
            return; // 다른 에러 처리 중단
          }
        }

        // 비밀번호 변경 관련 특별 처리
        if (
          typeof backendError === 'string' &&
          (backendError.includes('비밀번호') ||
            backendError.includes('password'))
        ) {
          errorTitle = '비밀번호 변경됨';
          errorDescription =
            '비밀번호가 변경되었습니다. 비밀번호 찾기를 이용해 새로운 비밀번호를 설정해주세요.';
        } else if (typeof backendError === 'string') {
          errorDescription = backendError;
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleLogin = () => {
    // 구글 로그인 시작
    authApi.googleLogin();
  };

  const handleFindPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 로그인 안내 멘트 */}
      <div className="mt-8 text-center">
        <h2
          className="text-3xl font-serif mb-5 tracking-tight"
          style={{ color: BRAND_COLORS.PRIMARY }}
        >
          새김에 오신 것을 환영합니다
        </h2>
        <div
          className="mb-10 space-y-2"
          style={{ color: BRAND_COLORS.SECONDARY }}
        >
          <p className="text-base font-light tracking-wide">
            AI와 함께하는 감성 다이어리로
          </p>
          <p className="text-base font-light tracking-wide">
            일상을 기록해보세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 아이디(메일계정) 입력 */}
        <div>
          <FormInput
            type="email"
            id="email"
            placeholder="아이디(메일계정) 입력"
            aria-describedby="email-help"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
          <p id="email-help" className="sr-only">
            이메일 주소를 입력해주세요
          </p>
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <FormInput
            type="password"
            id="password"
            placeholder="비밀번호 입력"
            aria-describedby="password-help"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
          <p id="password-help" className="sr-only">
            비밀번호를 입력해주세요
          </p>
        </div>

        {/* 로그인하기 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '로그인 중...' : '로그인하기'}
        </button>

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton onClick={handleGoogleLogin} />

        {/* 비밀번호 찾기 */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleFindPassword}
            className="text-gray-600 dark:text-text-dark-primary hover:text-sage-50 dark:hover:text-text-dark-inverse font-light text-sm tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary rounded-lg px-3 py-1 hover:bg-gray-100 dark:hover:bg-background-dark-hover"
            aria-label="비밀번호 찾기"
          >
            비밀번호 찾기
          </button>
        </div>
      </form>
    </div>
  );
}
