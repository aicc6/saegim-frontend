'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, clearStorage } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 서버에서 현재 사용자 정보 확인
        const response = await authApi.getCurrentUser();
        const userData = response.data as any;
        
        // 서버 인증 성공
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error: any) {
        console.error('❌ AuthGuard: 서버 인증 실패:', error);
        
        // 로컬 스토리지 완전 정리
        clearStorage();
        
        // 탈퇴된 계정인지 확인
        if (error.response?.status === 403 && error.response?.data?.detail?.error === 'ACCOUNT_DELETED') {
          const detail = error.response.data.detail;
          if (detail.restore_available) {
            router.push(`/landing?status=withdraw&message=탈퇴된 계정입니다. ${detail.days_remaining}일 이내에 복구할 수 있습니다.`);
          } else {
            router.push('/landing?status=withdraw&message=탈퇴 후 30일이 경과되어 복구할 수 없습니다.');
          }
        } else {
          // 일반적인 인증 실패
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [router, clearStorage]);

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

  if (!isAuthorized) {
    return null; // 리다이렉트 중
  }

  return <>{children}</>;
}
