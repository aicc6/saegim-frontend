'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  PenTool,
  Grid3X3,
  Calendar,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/sidebar-context';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuthStore } from '@/stores/auth';
import { useFCMStore } from '@/stores/fcm';
import { authApi, getLogger } from '@/lib';
import ThemeToggle from '../ui/custom/ThemeToggle';
import LanguageToggle from '../ui/custom/LanguageToggle';
import NotificationPopover from './NotificationPopover';

const logger = getLogger('Sidebar');

export function Sidebar() {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // 강제 리렌더링을 위한 상태
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user: authUser } = useAuthStore();
  const { toast } = useToast();

  const navigation = [
    { name: t('nav.write'), href: '/', icon: PenTool },
    { name: t('nav.list'), href: '/list', icon: Grid3X3 },
    { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
  ];

  // 알림 관련 상태
  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const {
    unreadCount: fcmUnreadCount,
    notifications: fcmNotifications,
    markAsRead: fcmMarkAsRead,
    markAllAsRead: fcmMarkAllAsRead,
  } = useFCMStore();

  // 전역 상태에서 사용자 정보 사용 (ProfileForm에서 updateUser 호출 시 자동 반영)

  // 전역 상태를 직접 구독하여 변경 감지
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.user,
      (user) => {
        logger.info('사이드바: 전역 상태 직접 구독으로 변경 감지:', {
          hasProfileImage: !!user?.profileImage,
          profileImage: user?.profileImage,
          nickname: user?.nickname,
        });
        // 강제 리렌더링 트리거
        setForceUpdate((prev) => prev + 1);
      },
    );

    return unsubscribe;
  }, []);

  // 전역 상태 변경 감지 (프로필 이미지 업데이트 시 즉시 반영)
  useEffect(() => {
    // authUser가 변경될 때마다 사이드바가 자동으로 리렌더링됨
    // 이는 useAuthStore의 subscribeWithSelector 덕분에 자동으로 처리됨
    logger.info('사이드바 사용자 정보 업데이트:', {
      hasProfileImage: !!authUser?.profileImage,
      profileImage: authUser?.profileImage,
      nickname: authUser?.nickname,
    });

    // 강제 리렌더링 트리거
    setForceUpdate((prev) => prev + 1);
  }, [authUser]);

  // 전역 상태 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleAuthUpdate = (event: CustomEvent) => {
      logger.info('사이드바: 전역 상태 변경 이벤트 수신:', event.detail);
      // 강제 리렌더링 트리거
      setForceUpdate((prev) => prev + 1);
    };

    const handleSidebarForceUpdate = (event: CustomEvent) => {
      logger.info('사이드바: 강제 업데이트 이벤트 수신:', event.detail);
      // 강제 리렌더링 트리거
      setForceUpdate((prev) => prev + 1);

      // 전역 상태에서 최신 정보 가져오기
      const currentUser = useAuthStore.getState().user;
      logger.info('사이드바: 강제 업데이트 후 전역 상태 확인:', {
        currentUser: currentUser,
        profileImage: currentUser?.profileImage,
      });
    };

    window.addEventListener('auth-update', handleAuthUpdate as EventListener);
    window.addEventListener(
      'sidebar-force-update',
      handleSidebarForceUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        'auth-update',
        handleAuthUpdate as EventListener,
      );
      window.removeEventListener(
        'sidebar-force-update',
        handleSidebarForceUpdate as EventListener,
      );
    };
  }, []);

  // 디버깅을 위한 로그
  useEffect(() => {
    logger.info('사이드바 마운트/업데이트:', {
      hasProfileImage: !!authUser?.profileImage,
      profileImage: authUser?.profileImage,
      nickname: authUser?.nickname,
      fullUser: authUser,
      forceUpdate,
    });
  }, [authUser, forceUpdate]);

  const handleLogout = async () => {
    try {
      // 로그아웃 전에 현재 프로필 이미지를 localStorage에 보존
      if (authUser?.profileImage && typeof window !== 'undefined') {
        try {
          localStorage.setItem('saegim-profile-image', authUser.profileImage);
          logger.info(
            '사이드바: 로그아웃 시 프로필 이미지 보존됨:',
            authUser.profileImage,
          );
        } catch (error) {
          logger.warn('사이드바: 로그아웃 시 프로필 이미지 보존 실패:', error);
        }
      }

      // 백엔드에 로그아웃 요청
      await authApi.logout();

      // 클라이언트 상태 정리
      logout();

      // 성공 토스트 표시
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccess'),
        variant: 'default',
      });

      // 랜딩 페이지로 리다이렉트 후 강제 새로고침
      router.push('/landing?status=logout');
      // 클라이언트 상태 완전 정리를 위해 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      logger.error('로그아웃 처리 중 오류', { error });

      // 에러 발생 시에도 프로필 이미지 보존
      if (authUser?.profileImage && typeof window !== 'undefined') {
        try {
          localStorage.setItem('saegim-profile-image', authUser.profileImage);
          logger.info(
            '사이드바: 에러 발생 시에도 프로필 이미지 보존됨:',
            authUser.profileImage,
          );
        } catch (error) {
          logger.warn('사이드바: 에러 발생 시 프로필 이미지 보존 실패:', error);
        }
      }

      // 에러가 발생해도 클라이언트 상태는 정리하고 로그인 페이지로 이동
      logout();

      // 에러 토스트 표시
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccess'),
        variant: 'default',
      });

      router.push('/landing?status=logout');
      // 클라이언트 상태 완전 정리를 위해 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  // 사용자 표시 이름 (닉네임이 있으면 닉네임, 없으면 이메일)
  const displayName =
    authUser?.nickname || authUser?.email || t('profile.defaultDisplayName');

  // 프로필 이미지 우선순위: 전역 상태 > localStorage > 백업 > 추가 백업들
  const getProfileImage = () => {
    if (authUser?.profileImage) return authUser.profileImage;
    if (typeof window !== 'undefined') {
      try {
        // 여러 저장소에서 확인
        const storageKeys = [
          'saegim-profile-image',
          'saegim-profile-image-backup',
          'saegim-user-profile-image',
          'user-profile-image-saegim',
        ];

        for (const key of storageKeys) {
          const savedImage = localStorage.getItem(key);
          if (savedImage) {
            logger.info(`사이드바: ${key}에서 프로필 이미지 로드:`, savedImage);

            // 메인 저장소가 아니면 복원
            if (key !== 'saegim-profile-image') {
              localStorage.setItem('saegim-profile-image', savedImage);
              logger.info('사이드바: 프로필 이미지 메인 저장소로 복원됨');
            }

            return savedImage;
          }
        }

        logger.info('사이드바: 모든 저장소에서 프로필 이미지를 찾을 수 없음');
      } catch (error) {
        logger.error(
          '사이드바: localStorage에서 프로필 이미지 로드 실패:',
          error,
        );
      }
    }
    return null;
  };

  const profileImage = getProfileImage();

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r transition-all duration-300 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${
          isDark
            ? 'lg:bg-gray-900 lg:border-gray-700'
            : 'lg:bg-white lg:border-sage-20'
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* 사용자 프로필 */}
          <div
            className={`flex-shrink-0 h-18 border-b flex items-center ${
              isCollapsed ? 'px-2' : 'px-4'
            } ${isDark ? 'border-gray-700' : 'border-sage-20'}`}
          >
            {isCollapsed ? (
              <div className="flex flex-col space-y-1 w-full">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full p-2 ${
                      pathname === '/profile'
                        ? isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-sage-20 text-sage-100'
                        : isDark
                          ? 'text-gray-300 hover:text-white'
                          : 'text-sage-70 hover:text-sage-100'
                    }`}
                  >
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt={t('profile.profileImageAlt')}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-full p-2 ${
                    isDark
                      ? 'text-gray-300 hover:text-red-400'
                      : 'text-sage-70 hover:text-red-500'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    className={`justify-start ${
                      pathname === '/profile'
                        ? isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-sage-20 text-sage-100'
                        : isDark
                          ? 'text-gray-300 hover:text-white'
                          : 'text-sage-70 hover:text-sage-100'
                    }`}
                  >
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt={t('profile.profileImageAlt')}
                        width={20}
                        height={20}
                        className="mr-3 h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="mr-3 h-5 w-5" />
                    )}
                    {displayName}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`p-2 ${
                    isDark
                      ? 'text-gray-300 hover:text-red-400'
                      : 'text-sage-70 hover:text-red-500'
                  }`}
                  title={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 네비게이션 메뉴 */}
          <nav
            className={`flex-1 px-2 py-4 space-y-1 ${
              isCollapsed ? 'px-1' : 'px-2'
            }`}
          >
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-sage-20 text-sage-100'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* 하단 설정 영역 */}
          <div
            className={`border-t px-2 py-3 ${
              isDark ? 'border-gray-700' : 'border-sage-20'
            }`}
          >
            <div
              className={`flex ${isCollapsed ? 'flex-col space-y-2' : 'justify-around'} items-center`}
            >
              <LanguageToggle
                variant="segment"
                className={isCollapsed ? 'w-full' : 'min-w-[6.5rem]'}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* 토글 버튼 - 프로필 영역과 수평 정렬 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`!hidden lg:!block fixed top-6 z-40 p-2 rounded-full shadow-md transition-all duration-300 ${
          isDark
            ? 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white'
            : 'bg-white border-sage-20 text-sage-70 hover:text-sage-100'
        } border`}
        style={{
          top: '1rem', // 프로필 버튼과 수평 정렬
          left: isCollapsed ? '3rem' : '15rem', // 접힌 상태: 사이드바 우측 경계 중앙(48px), 펼친 상태: 사이드바 우측 경계(240px)
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* 모바일 헤더 */}
      <div
        className={`lg:hidden border-b px-4 py-3 ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/images/logoop.png"
              alt={t('common.logoAlt')}
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>

          <div className="flex items-center space-x-2">
            <NotificationPopover
              notifications={notifications}
              fcmNotifications={fcmNotifications}
              fcmUnreadCount={fcmUnreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
              onFCMMarkAsRead={fcmMarkAsRead}
              onFCMMarkAllAsRead={fcmMarkAllAsRead}
            />

            <LanguageToggle variant="segment" className="min-w-[6.5rem]" />
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={isDark ? 'text-gray-300 hover:text-white' : ''}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden border-b ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
          }`}
        >
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {/* 프로필과 로그아웃 */}
            <div className="flex items-center justify-between px-3 py-2">
              <Link
                href="/profile"
                className={`group flex items-center text-base font-medium rounded-md transition-colors ${
                  pathname === '/profile'
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-sage-20 text-sage-100'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={t('profile.profileImageAlt')}
                    width={24}
                    height={24}
                    className="mr-4 h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="mr-4 h-6 w-6" />
                )}
                {displayName}
              </Link>

              <div className="flex items-center space-x-2">
                <LanguageToggle variant="segment" className="min-w-[6.5rem]" />
                <ThemeToggle />
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`group flex items-center p-2 text-base font-medium rounded-md transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-red-500'
                  }`}
                  title={t('nav.logout')}
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* 모바일 하단 네비게이션 */}
      <div
        className={`lg:hidden fixed bottom-0 z-40 left-0 right-0 border-t px-4 py-2 ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
        }`}
      >
        <nav className="flex justify-around">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-sage-100'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-sage-60 hover:text-sage-100'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
