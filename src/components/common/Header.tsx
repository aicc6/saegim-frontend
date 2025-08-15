'use client';

import { Leaf, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

type ThemeMode = 'light' | 'dark';

export default function Header() {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== 'undefined' &&
      localStorage.getItem('theme')) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
      applyTheme(saved);
      return;
    }
    // default: light
    applyTheme('light');
  }, []);

  const applyTheme = (next: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  };

  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    applyTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem('theme', next);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-sage-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sage-50 rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-sage-100" />
            </div>
            <span className="text-xl font-bold text-sage-100">새김</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/login"
              className="text-sage-80 hover:text-sage-100 transition-colors flex items-center"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-sage-80 hover:text-sage-100 transition-colors flex items-center"
            >
              회원가입
            </Link>
            <button
              type="button"
              onClick={toggleMode}
              aria-label="모드 전환"
              className="rounded-lg border border-sage-30 bg-white px-3 py-2 text-body text-text-primary hover:bg-sage-20"
            >
              {mode === 'light' ? '🌙 다크' : '☀️ 라이트'}
            </button>
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
          <div className="md:hidden border-t border-sage-20 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/login"
                className="text-sage-80 hover:text-sage-100 transition-colors flex items-center"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sage-80 hover:text-sage-100 transition-colors flex items-center"
              >
                회원가입
              </Link>
              <button
                type="button"
                onClick={toggleMode}
                aria-label="모드 전환"
                className="rounded-lg border border-sage-30 bg-white px-3 py-2 text-body text-text-primary hover:bg-sage-20"
              >
                {mode === 'light' ? '🌙 다크' : '☀️ 라이트'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
