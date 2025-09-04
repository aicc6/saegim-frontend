'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth';
import { authApi, getLogger } from '@/lib';
import { AuthUserResponse } from '@/types/api';

const logger = getLogger('AuthGuard');

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { clearStorage, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 서버에서 현재 사용자 정보 확인
        const response = await authApi.getCurrentUser();

        // 응답 데이터 검증
        if (!response.success || !response.data) {
          throw new Error('Invalid server response structure');
        }

        const userData = response.data as AuthUserResponse;

        // 사용자 데이터 유효성 검증
        if (!userData.user_id || !userData.email) {
          throw new Error('Invalid user data: missing required fields');
        }

        // localStorage에서 프로필 이미지 복원 (우선순위: localStorage > 백업들 > 서버 데이터)
        let profileImage = userData.profile_image || '';
        if (typeof window !== 'undefined') {
          try {
            // 여러 저장소에서 확인
            const storageKeys = [
              'saegim-profile-image',
              'saegim-profile-image-backup',
              'saegim-user-profile-image',
              'user-profile-image-saegim',
            ];

            let foundImage = null;
            for (const key of storageKeys) {
              const savedImage = localStorage.getItem(key);
              if (savedImage) {
                foundImage = savedImage;
                logger.info(
                  `AuthGuard: ${key}에서 프로필 이미지 복원됨:`,
                  savedImage,
                );
                break;
              }
            }

            if (foundImage) {
              profileImage = foundImage;
              // 메인 저장소로 복원
              localStorage.setItem('saegim-profile-image', foundImage);
            } else {
              logger.info(
                'AuthGuard: 저장된 프로필 이미지 없음, 서버 데이터 사용:',
                userData.profile_image,
              );
            }
          } catch (error) {
            logger.warn('AuthGuard: 프로필 이미지 복원 실패:', error);
          }
        }

        // provider 타입 안전성 검증
        const validProviders: readonly (
          | 'google'
          | 'kakao'
          | 'naver'
          | 'email'
        )[] = ['google', 'kakao', 'naver', 'email'];
        const provider =
          userData.provider &&
          validProviders.includes(
            userData.provider as 'google' | 'kakao' | 'naver' | 'email',
          )
            ? (userData.provider as 'google' | 'kakao' | 'naver' | 'email')
            : 'email';

        // 전역 상태에 사용자 정보 저장 (프로필 이미지 포함)
        updateUser({
          id: userData.user_id,
          email: userData.email,
          name: userData.nickname || userData.email,
          nickname: userData.nickname || userData.email,
          profileImage: profileImage,
          provider: provider,
          createdAt: new Date().toISOString(),
        });

        // 서버 인증 및 데이터 검증 모두 통과
        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';
        logger.error('서버 인증 실패', { errorMessage });

        // 로컬 스토리지 완전 정리
        clearStorage();

        // 탈퇴된 계정인지 확인 (API 에러 응답 처리)
        const apiError = error as {
          response?: {
            status: number;
            data?: {
              detail?: {
                error?: string;
                restore_available?: boolean;
                days_remaining?: number;
              };
            };
          };
        };
        if (
          apiError.response?.status === 403 &&
          apiError.response?.data?.detail?.error === 'ACCOUNT_DELETED'
        ) {
          const detail = apiError.response.data.detail;
          if (detail?.restore_available) {
            router.push(
              `/landing?status=withdraw&message=탈퇴된 계정입니다. ${detail.days_remaining}일 이내에 복구할 수 있습니다.`,
            );
          } else {
            router.push(
              '/landing?status=withdraw&message=탈퇴 후 30일이 경과되어 복구할 수 없습니다.',
            );
          }
        } else {
          // 일반적인 인증 실패
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [router, clearStorage, updateUser]);

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
