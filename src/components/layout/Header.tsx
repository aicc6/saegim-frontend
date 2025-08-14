'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  return (
    <header
      className="w-full border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
      style={{ backgroundColor: 'var(--header-background)' }}
    >
      <div className="flex justify-between items-center px-4 py-4">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg p-1"
          aria-label="새김 홈으로 이동"
        >
          <span
            className="text-2xl font-serif tracking-wide"
            style={{ color: 'var(--header-text)' }}
          >
            새김
          </span>
        </Link>

        {/* 네비게이션 */}
        <nav
          className="flex items-center space-x-6"
          role="navigation"
          aria-label="메인 네비게이션"
        >
          <Link
            href="/login"
            className="hover:bg-white/10 dark:hover:bg-sage-50/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-sage-50 focus:ring-offset-2 focus:ring-offset-[#5C8D89] dark:focus:ring-offset-[#E8F0EE] rounded-lg px-3 py-2"
            style={{ color: 'var(--header-text)' }}
            aria-label="로그인 페이지로 이동"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="hover:bg-white/10 dark:hover:bg-sage-50/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-sage-50 focus:ring-offset-2 focus:ring-offset-[#5C8D89] dark:focus:ring-offset-[#E8F0EE] rounded-lg px-3 py-2"
            style={{ color: 'var(--header-text)' }}
            aria-label="회원가입 페이지로 이동"
          >
            회원가입
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
