'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { API_BASE_URL } from '@/lib/api';
import CreateAi from '@/components/individual/shw/CreateAi';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 이미 체크했거나 로딩 중이 아니면 스킵
    if (hasChecked) return;

    const handleAuthCheck = async () => {
      try {
        // URL 파라미터 확인 (로그인 성공 여부)
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        // 로그인 실패 시
        if (error) {
          console.error('로그인 실패:', message);
          setHasChecked(true);
          router.push('/login');
          return;
        }

        // 항상 서버에서 인증 상태를 확인 (로그아웃 후 쿠키 삭제 반영)
        try {
          console.log('🔍 인증 상태 확인 중...');
          
          // Bearer 토큰 가져오기
          const token = localStorage.getItem('access_token');
          
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include', // 쿠키 포함 (Google OAuth용)
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }), // Bearer 토큰 포함 (이메일 로그인용)
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ 인증 성공:', userData.data.email ? `${userData.data.email.substring(0, 3)}***@${userData.data.email.split('@')[1]}` : '사용자');
            
            // Zustand 스토어에 로그인 정보 저장
            login({
              id: userData.data.user_id,
              email: userData.data.email,
              name: userData.data.nickname,
              profileImage: '',
              provider: userData.data.provider || 'email',
              createdAt: userData.data.created_at || new Date().toISOString(),
            }, token || 'cookie-based-auth');
            
            // URL 파라미터 제거
            if (success === 'true') {
              router.replace('/');
            }
            
            setHasChecked(true);
            setIsLoading(false);
          } else {
            console.log('❌ 인증 실패:', response.status);
            // 인증 실패 시 클라이언트 상태 정리 후 로그인 페이지로 리다이렉트
            logout(); // 클라이언트 상태 정리
            localStorage.removeItem('access_token'); // localStorage 토큰도 정리
            localStorage.removeItem('refresh_token');
            setHasChecked(true);
            router.push('/login');
            return;
          }
        } catch (err) {
          console.error('❌ 인증 상태 확인 실패:', err);
          // 에러 시에도 클라이언트 상태 정리 후 로그인 페이지로 리다이렉트
          logout(); // 클라이언트 상태 정리
          localStorage.removeItem('access_token'); // localStorage 토큰도 정리
          localStorage.removeItem('refresh_token');
          setHasChecked(true);
          router.push('/login');
          return;
        }
      } catch (err) {
        console.error('❌ 인증 체크 실패:', err);
        setHasChecked(true);
        router.push('/login');
      }
    };

    handleAuthCheck();
  }, [searchParams, router, login, logout, hasChecked]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
          <p className="text-sage-80 dark:text-gray-300">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 상태 (리다이렉트 중)
  if (!isAuthenticated || !user) {
    return null;
  }

  // 인증된 상태 - 메인 콘텐츠 표시
  return (
    <div>
      <div className="bg-sage-20 flex items-center justify-center">
        <main className="w-full max-w-2xl px-4 py-10 animate-page-transition">
          <CreateAi />
        </main>
      </div>
    </div>
  );
}
