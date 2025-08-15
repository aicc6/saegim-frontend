'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Bell, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function AutheticatedHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // TODO: 실제 알림 상태관리에서 가져와야 함
  const unreadNotificationCount = 3; // 임시 하드코딩

  // 클라이언트 사이드에서만 테마 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    console.log('테마 변경:', theme, '→', newTheme);
    
    // 강제로 클래스 적용 (디버깅용)
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleNotification = () => {
    // 알림 로직
    console.log('알림 클릭');
  };

  return (
    <div className="bg-white border-b border-sage-20 p-4 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-full mx-auto flex items-center justify-between">
        {/* 좌측: 로고와 서비스명 */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <Image
              src="/images/logo.webp"
              alt="새김 로고"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-xl font-bold text-sage-100 dark:text-white">
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
              className="p-2 text-sage-70 hover:text-sage-100 hover:bg-sage-10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {unreadNotificationCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 p-0 text-[10px] bg-red-500 text-white border-white border-[1px] flex items-center justify-center rounded-full">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-sage-70 hover:text-sage-100 hover:bg-sage-10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
