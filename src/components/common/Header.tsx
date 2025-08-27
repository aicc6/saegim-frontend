'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/custom/ThemeToggle';

export default function Header() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, logout, clearStorage } = useAuthStore();
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

  const handleLogoClick = () => {
    // 인증된 사용자인 경우 로그아웃 처리 후 랜딩페이지로 이동
    if (isAuthenticated) {
      clearStorage();
      router.push('/landing?status=logout');
    } else {
      // 비인증 사용자는 랜딩페이지로 이동
      router.push('/landing');
    }
  };

  return (
    <nav
      className={`border-b sticky top-0 z-50 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity"
          >
            <div className="w-18 h-18 rounded-full flex items-center justify-center">
              <Image
                src="/images/logoop.png"
                alt="새김 로고"
                width={72}
                height={72}
                className="w-18 h-18"
              />
            </div>
          </button>

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
