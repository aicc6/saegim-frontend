'use client';

import { Menu, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-sage-20 sticky top-0 z-50 dark:bg-gray-900/80 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <Image
                src="/logo.webp"
                alt="새김 로고"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <span className="text-xl font-bold text-sage-100 dark:text-white">
              새김
            </span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/login"
              className="text-sage-80 hover:text-sage-100 transition-colors flex items-center dark:text-gray-300 dark:hover:text-white"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-sage-80 hover:text-sage-100 transition-colors flex items-center dark:text-gray-300 dark:hover:text-white"
            >
              회원가입
            </Link>
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

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-sage-20 py-4 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link
                href="/login"
                className="text-sage-80 hover:text-sage-100 transition-colors flex items-center dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sage-80 hover:text-sage-100 transition-colors flex items-center dark:text-gray-300 dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                회원가입
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="justify-start p-2 text-sage-70 hover:text-sage-100 hover:bg-sage-10 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
              >
                {mounted && theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5 mr-2" />
                    라이트 모드
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 mr-2" />
                    다크 모드
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
