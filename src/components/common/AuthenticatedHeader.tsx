'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useNotifications } from '@/hooks/use-notifications';
import ThemeToggle from '../ui/custom/ThemeToggle';
import NotificationPopover from './NotificationPopover';

export default function AutheticatedHeader() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  // 클라이언트 사이드에서만 테마 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

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
              src="/images/logoop.png"
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

        {/* 우측: 알림 및 테마 토글 버튼 */}
        <div className="flex items-center space-x-2">
          <NotificationPopover
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDeleteNotification={deleteNotification}
          />

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
