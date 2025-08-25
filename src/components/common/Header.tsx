'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/custom/ThemeToggle';

export default function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 클라이언트 사이드에서만 테마 렌더링 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <nav
      className={`border-b sticky top-0 z-50 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <Image
                src="/images/logoop.png"
                alt="새김 로고"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <span
              className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-sage-100'
              }`}
            >
              새김
            </span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/login"
              className={`transition-colors flex items-center ${
                isDark
                  ? 'text-gray-300 hover:text-white'
                  : 'text-sage-80 hover:text-sage-100'
              }`}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className={`transition-colors flex items-center ${
                isDark
                  ? 'text-gray-300 hover:text-white'
                  : 'text-sage-80 hover:text-sage-100'
              }`}
            >
              회원가입
            </Link>
            <ThemeToggle />
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
          <div
            className={`md:hidden border-t py-4 ${
              isDark ? 'border-gray-700' : 'border-sage-20'
            }`}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href="/login"
                className={`transition-colors flex items-center ${
                  isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-sage-80 hover:text-sage-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className={`transition-colors flex items-center ${
                  isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-sage-80 hover:text-sage-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                회원가입
              </Link>
              <div className="flex justify-start">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
