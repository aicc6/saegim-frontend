'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
        
        // 로그인 실패 시
        if (error) {
          console.error('로그인 실패:', message);
          router.push('/login');
          return;
        }
        
        // 로그인 성공 시 메인 페이지로 리다이렉트
        if (success === 'true') {
          // 백엔드에서 쿠키에 토큰을 설정했으므로 바로 메인 페이지로 리다이렉트
          router.push('/?success=true');
        } else {
          // 잘못된 접근
          router.push('/login');
        }
        
      } catch (err) {
        console.error('콜백 처리 실패:', err);
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
