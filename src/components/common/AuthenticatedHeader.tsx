'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useNotifications } from '@/hooks/use-notifications';
import { useFCMStore } from '@/stores/fcm';
import { authApi } from '@/lib/api';
import ThemeToggle from '../ui/custom/ThemeToggle';
import NotificationPopover from './NotificationPopover';

interface UserInfo {
  email: string;
  nickname: string;
  account_type: string;
}

export default function AuthenticatedHeader() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  
  // FCM 알림 상태 가져오기
  const { unreadCount: fcmUnreadCount, notifications: fcmNotifications, markAsRead: fcmMarkAsRead, markAllAsRead: fcmMarkAllAsRead } = useFCMStore();

  // 클라이언트 사이드에서만 테마 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await authApi.getCurrentUser();
        if (response.data) {
          setUserInfo(response.data as UserInfo);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      fetchUserInfo();
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <div
      className={`border-b h-18 px-12 w-full flex items-center ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      }`}
    >
      <div className="max-w-full mx-auto flex items-center justify-between w-full">
        {/* 좌측: 로고와 서비스명 */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <Image
              src="/images/logo.webp"
              alt="새김 로고"
              width={32}
              height={32}
              className="w-10 h-10"
            />
          </div>
          <h1
            className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-sage-100'
            }`}
          >
            새김
          </h1>
        </div>

        {/* 우측: 알림, 테마 토글, 프로필 */}
        <div className="flex items-center space-x-4">
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

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
