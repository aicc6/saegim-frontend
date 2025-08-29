'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLogger } from '@/lib/logger';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

const logger = getLogger('auth-callback');

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        logger.debug('콜백 파라미터:', { success, error, message });

        // 로그인 실패 시
        if (error) {
          logger.error('로그인 실패:', message);

          // 탈퇴된 계정 에러 처리
          if (
            error === 'account_deleted' ||
            error === 'account_permanently_deleted'
          ) {
            const restoreAvailable =
              searchParams.get('restore_available') === 'true';
            const daysRemaining = searchParams.get('days_remaining');

            if (restoreAvailable) {
              // 복구 가능한 경우 복구 페이지로 이동
              router.push(
                `/restore-account?email=${searchParams.get('email') || ''}&message=${encodeURIComponent(message || '')}&days_remaining=${daysRemaining || 0}`,
              );
            } else {
              // 복구 불가능한 경우 로그인 페이지로 이동
              router.push(
                `/login?error=account_permanently_deleted&message=${encodeURIComponent(message || '')}`,
              );
            }
          } else {
            // 기타 에러는 로그인 페이지로 이동
            router.push(
              `/login?error=${error}&message=${encodeURIComponent(message || '')}`,
            );
          }

          setIsLoading(false);
          return;
        }

        // 로그인 성공 시 메인 페이지로 리다이렉트
        if (success === 'true') {
          logger.info('로그인 성공 - 메인 페이지로 이동');
          setIsLoading(false);
          // 백엔드에서 쿠키에 토큰을 설정했으므로 바로 메인 페이지로 리다이렉트
          router.push('/?success=true');
        } else {
          logger.warn('잘못된 접근 - 로그인 페이지로 이동');
          setIsLoading(false);
          // 잘못된 접근
          router.push('/login');
        }
      } catch (err) {
        logger.error('콜백 처리 실패:', err);
        setIsLoading(false);
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-10 to-sage-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
          <p className="text-sage-80 dark:text-gray-300">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  return null;
}

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-10 to-sage-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
        <p className="text-sage-80 dark:text-gray-300">페이지 로드 중...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
