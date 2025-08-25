'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';
import CreateAi from '@/components/creatAi/CreateAi';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect 실행됨 - hasChecked:', hasChecked);

    // 이미 체크했으면 스킵
    if (hasChecked) {
      console.log('⏭️ 이미 체크됨 - 스킵');
      return;
    }

    const handleAuthCheck = async () => {
      console.log('🚀 handleAuthCheck 시작');
      try {
        // URL 파라미터 확인 (로그인 성공 여부)
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        console.log('📋 URL 파라미터:', { success, error, message });

        // 로그인 실패 시
        if (error) {
          console.error('로그인 실패:', message);
          setHasChecked(true);
          setIsLoading(false);
          router.push('/login');
          return;
        }

        // 인증 상태 확인
        console.log('🔍 인증 상태 확인:', { isAuthenticated, hasUser: !!user });

        // 이미 인증된 상태라면 스킵
        if (isAuthenticated && user) {
          console.log('✅ 이미 인증됨 - 스킵');
          setIsLoading(false);
          setHasChecked(true);
          return;
        }

        // 쿠키 기반 인증 확인 (localStorage 토큰 불필요)
        console.log('🔍 쿠키 기반 인증 확인 중');

        try {
          console.log('🔍 서버 인증 확인 중...');

          const response = await authApi.getCurrentUser();
          const userData = response.data as any;
          console.log(
            '✅ 서버 인증 성공:',
            userData.email
              ? `${userData.email.substring(0, 3)}***@${userData.email.split('@')[1]}`
              : '사용자',
          );

          // Zustand 스토어에 로그인 정보 저장
          login({
            id: userData.user_id,
            email: userData.email,
            name: userData.nickname,
            profileImage: '',
            provider: userData.provider || 'email',
            createdAt: userData.created_at || new Date().toISOString(),
          });

          // 로딩 완료
          setIsLoading(false);
          setHasChecked(true);

          // URL 파라미터 제거
          if (success === 'true') {
            router.replace('/');
          }
        } catch (err) {
          console.error('❌ 서버 인증 확인 실패:', err);

          // 쿠키 기반 인증이므로 localStorage 정리 불필요
          console.log('🧹 쿠키 기반 인증이므로 localStorage 정리 불필요');

          // Zustand 스토어 정리
          logout();

          // 에러 발생 시 로그인 페이지로 이동
          setHasChecked(true);
          setIsLoading(false);
          router.push('/login');
        }
      } catch (err) {
        console.error('❌ 인증 체크 실패:', err);
        setHasChecked(true);
        setIsLoading(false);
        router.push('/login');
      }
    };

    // 약간의 지연을 두어 페이지 로딩 완료 후 인증 확인
    const timer = setTimeout(() => {
      console.log('⏰ 타이머 실행 - 인증 확인 시작');
      handleAuthCheck();
    }, 100);

    return () => {
      console.log('🧹 useEffect 정리 - 타이머 취소');
      clearTimeout(timer);
    };
  }, []); // 의존성 배열을 비워서 컴포넌트 마운트 시에만 실행

  // 로딩 중일 때는 로딩 화면 표시
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

  // 인증 확인 완료 후 인증되지 않았을 때만 리다이렉트
  if (!isAuthenticated || !user) {
    return null; // router.push('/login')이 이미 실행됨
  }

  // 토큰이 있으면 메인 콘텐츠 표시 (서버 인증 결과와 관계없이)
  console.log('🎨 CreateAi 컴포넌트 렌더링 시작');

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

export default function Home() {
  console.log('🏠 Home 컴포넌트 렌더링');

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sage-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-50 mx-auto mb-4"></div>
            <p className="text-sage-80 dark:text-gray-300">로딩 중...</p>
            <p className="text-sm text-gray-500 mt-2">
              Suspense fallback 실행 중
            </p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
