'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const tokenId = searchParams.get('token_id');
        const error = searchParams.get('error');
        
        if (error) {
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
          setIsLoading(false);
          return;
        }
        
        if (!tokenId) {
          setError('토큰 ID가 없습니다.');
          setIsLoading(false);
          return;
        }

        // 백엔드에서 토큰 가져오기
        const response = await fetch(`${api.baseURL}/auth/google/token/${tokenId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to get token');
        }
        
        const tokenData = await response.json();
        
        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.setItem('refresh_token', tokenData.refresh_token);
        localStorage.setItem('isLoggedIn', 'true');
        
        // 로그인 성공 후 메인 페이지로 리다이렉트
        router.push('/');
        
      } catch (err) {
        console.error('Google login callback error:', err);
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
        setIsLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sage-10 to-sage-20">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sage-80 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-sage-50 text-white rounded-lg hover:bg-sage-60 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
