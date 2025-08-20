'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import ThemeToggle from '../ui/custom/ThemeToggle';

export default function AutheticatedHeader() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // TODO: 실제 알림 상태관리에서 가져와야 함
  const unreadNotificationCount = 3; // 임시 하드코딩

  // 클라이언트 사이드에서만 테마 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  const handleNotification = () => {
    // 알림 로직
    console.log('알림 클릭');
  };

  return (
    <div
      className={`border-b py-4 px-12 w-full ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      }`}
    >
      <div className="max-w-full mx-auto flex items-center justify-between">
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
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNotification}
              className={`p-2 ${
                isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-sage-70 hover:text-sage-100 hover:bg-sage-10'
              }`}
            >
              <Bell className="w-5 h-5" />
            </Button>
            {unreadNotificationCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 p-0 text-[10px] bg-red-500 text-white border-white border-[1px] flex items-center justify-center rounded-full">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </Badge>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
