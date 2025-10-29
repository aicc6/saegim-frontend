'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import GoogleLoginButton from '@/components/ui/custom/GoogleLoginButton';
import { FormInput } from '@/components/ui/form-input';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/language';
import { authApi, getLogger } from '@/lib';
import { BRAND_COLORS } from '@/constants';
import { createLoginSchema, type LoginFormData } from '@/schemas/auth';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@/types/language';

interface LoginFormProps {
  redirectTo?: string | null;
}

const logger = getLogger('LoginForm');

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const schema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  // URL 파라미터로 전달된 에러 처리

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error && message) {
      let errorTitle = t('auth.loginForm.errors.genericTitle');
      let errorDescription = message;

      if (error === 'account_permanently_deleted') {
        errorTitle = t('auth.loginForm.errors.permanentTitle');
        errorDescription = t('auth.loginForm.errors.permanentDescription');
      } else if (error === 'account_deleted') {
        errorTitle = t('auth.loginForm.errors.restorableTitle');
        errorDescription =
          message ||
          t('auth.loginForm.errors.restorableDescription', { days: 30 });
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  }, [searchParams, toast, t]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      // 로그인 성공 시 백엔드에서 사용자 정보를 가져와서 스토어에 저장
      const userData = response.data;
      if (userData && typeof userData === 'object' && 'user_id' in userData) {
        // 백엔드에서 최신 사용자 정보 조회 (프로필 이미지 포함)
        try {
          const currentUserResponse = await authApi.getCurrentUser();
          if (currentUserResponse.success && currentUserResponse.data) {
            const currentUser = currentUserResponse.data;
            const languageStore = useLanguageStore.getState();
            const serverLanguage = currentUser.preferred_language;
            languageStore.setLanguageFromServer(
              isSupportedLanguage(serverLanguage) ? serverLanguage : null,
            );
            const resolvedLanguage = useLanguageStore.getState().language;

            // 백엔드의 최신 정보로 로그인
            // provider 타입 안전성 검증
            const validProviders: readonly (
              | 'google'
              | 'kakao'
              | 'naver'
              | 'email'
            )[] = ['google', 'kakao', 'naver', 'email'];
            const provider =
              currentUser.provider &&
              validProviders.includes(
                currentUser.provider as 'google' | 'kakao' | 'naver' | 'email',
              )
                ? (currentUser.provider as
                    | 'google'
                    | 'kakao'
                    | 'naver'
                    | 'email')
                : 'email';

            login({
              id: currentUser.user_id,
              email: currentUser.email,
              name: currentUser.nickname,
              nickname: currentUser.nickname,
              profileImage: currentUser.profile_image || '',
              provider: provider,
              createdAt: new Date().toISOString(),
              preferredLanguage: resolvedLanguage,
            });
          } else {
            // 백엔드 조회 실패 시 기본 정보로 로그인
            const fallbackLanguage =
              useLanguageStore.getState().language ?? DEFAULT_LANGUAGE;
            login({
              id: userData.user_id as string,
              email: userData.email as string,
              name: userData.nickname as string,
              nickname: userData.nickname as string,
              profileImage: '',
              provider: 'email',
              createdAt: new Date().toISOString(),
              preferredLanguage: fallbackLanguage,
            });
          }
        } catch (userInfoError) {
          logger.warn('사용자 정보 조회 실패, 기본 정보로 로그인', {
            userInfoError,
          });
          // 백엔드 조회 실패 시 기본 정보로 로그인
          const fallbackLanguage =
            useLanguageStore.getState().language ?? DEFAULT_LANGUAGE;
          login({
            id: userData.user_id as string,
            email: userData.email as string,
            name: userData.nickname as string,
            nickname: userData.nickname as string,
            profileImage: '',
            provider: 'email',
            createdAt: new Date().toISOString(),
            preferredLanguage: fallbackLanguage,
          });
        }
      } else {
        throw new Error(t('auth.loginForm.errors.invalidResponse'));
      }

      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.loginSuccess'),
        variant: 'default',
      });

      // 리다이렉트 경로가 있으면 해당 경로로, 없으면 메인 페이지로
      const redirectPath = redirectTo === 'records' ? '/list' : '/';
      router.push(redirectPath);
    } catch (error: unknown) {
      const fallbackMessage = t('auth.guard.unknownError');
      const errorInfo =
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : { message: fallbackMessage };

      logger.error('로그인 실패', { error, errorInfo });

      // 상세한 에러 메시지 처리
      let errorTitle = t('auth.loginForm.errors.genericTitle');
      let errorDescription = t('auth.loginForm.errors.genericDescription');

      if (error instanceof Error && error.message) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes('401') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('이메일 또는 비밀번호')
        ) {
          errorTitle = t('auth.loginForm.errors.unauthorizedTitle');
          errorDescription = t('auth.loginForm.errors.unauthorizedDescription');
        } else if (
          errorMessage.includes('password') &&
          !errorMessage.includes('이메일 또는')
        ) {
          errorTitle = t('auth.loginForm.errors.passwordTitle');
          errorDescription = t('auth.loginForm.errors.passwordDescription');
        } else if (
          errorMessage.includes('email') ||
          errorMessage.includes('user')
        ) {
          errorTitle = t('auth.loginForm.errors.notFoundTitle');
          errorDescription = t('auth.loginForm.errors.notFoundDescription');
        } else if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch')
        ) {
          errorTitle = t('auth.loginForm.errors.networkTitle');
          errorDescription = t('auth.loginForm.errors.networkDescription');
        } else if (errorMessage.includes('timeout')) {
          errorTitle = t('auth.loginForm.errors.timeoutTitle');
          errorDescription = t('auth.loginForm.errors.timeoutDescription');
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
            errorTitle = t('auth.loginForm.errors.restorableTitle');
            const daysRemaining = accountError.days_remaining ?? 30;
            errorDescription = t(
              'auth.loginForm.errors.restorableDescription',
              { days: daysRemaining },
            );

            // 복구 가능한 경우 복구 페이지로 이동 옵션 제공
            toast({
              title: t('auth.loginForm.toast.restorable'),
              description: t('auth.loginForm.toast.restorableInfo', {
                days: daysRemaining,
              }),
              variant: 'default',
              duration: 10000,
              action: (
                <button
                  onClick={() => router.push('/restore-account')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                >
                  🔄 {t('auth.loginForm.cta.restore')}
                </button>
              ),
            });
            return; // 다른 에러 처리 중단
          } else if (accountError.error === 'ACCOUNT_PERMANENTLY_DELETED') {
            errorTitle = t('auth.loginForm.errors.permanentTitle');
            errorDescription = t('auth.loginForm.errors.permanentDescription');

            // 영구 삭제된 계정에 대한 특별한 토스트 표시
            toast({
              title: t('auth.loginForm.toast.permanent'),
              description: t('auth.loginForm.toast.permanentInfo'),
              variant: 'default',
              duration: 10000,
              action: (
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 bg-sage-50 hover:bg-sage-60 text-white rounded-md transition-colors text-sm font-medium"
                >
                  ✨ {t('auth.loginForm.cta.createNew')}
                </button>
              ),
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
          errorTitle = t('auth.loginForm.errors.passwordTitle');
          errorDescription = t('auth.loginForm.errors.passwordDescription');
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
          {t('auth.welcome', '새김에 오신 것을 환영합니다')}
        </h2>
        <div
          className="mb-10 space-y-2"
          style={{ color: BRAND_COLORS.SECONDARY }}
        >
          <p className="text-base font-light tracking-wide">
            {t('auth.welcomeSubtitle1', 'AI와 함께하는 감성 다이어리로')}
          </p>
          <p className="text-base font-light tracking-wide">
            {t('auth.welcomeSubtitle2', '일상을 기록해보세요')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 아이디(메일계정) 입력 */}
        <div>
          <FormInput
            type="email"
            id="email"
            placeholder={t('auth.emailPlaceholder', '아이디(메일계정) 입력')}
            aria-describedby="email-help"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
          <p id="email-help" className="sr-only">
            {t('auth.emailHelp', '이메일 주소를 입력해주세요')}
          </p>
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <FormInput
            type="password"
            id="password"
            placeholder={t('auth.passwordPlaceholder', '비밀번호 입력')}
            aria-describedby="password-help"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
          <p id="password-help" className="sr-only">
            {t('auth.passwordHelp', '비밀번호를 입력해주세요')}
          </p>
        </div>

        {/* 로그인하기 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? t('auth.loggingIn', '로그인 중...')
            : t('auth.loginButton', '로그인하기')}
        </button>

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton onClick={handleGoogleLogin} />

        {/* 비밀번호 찾기 */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={handleFindPassword}
            className="text-gray-600 dark:text-text-dark-primary hover:text-sage-50 dark:hover:text-text-dark-inverse font-light text-sm tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-border-dark-focus focus:ring-offset-2 dark:focus:ring-offset-background-dark-secondary rounded-lg px-3 py-1 hover:bg-gray-100 dark:hover:bg-background-dark-hover"
            aria-label={t('auth.forgotPassword')}
          >
            {t('auth.forgotPassword')}
          </button>
        </div>
      </form>
    </div>
  );
}
