'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogin = () => {
    // 임시 로그인 - 실제로는 소셜 로그인 구현
    const mockUser = {
      id: '1',
      email: 'user@example.com',
      name: '새김이',
      provider: 'google' as const,
      createdAt: new Date().toISOString(),
    };
    useAuthStore.getState().login(mockUser, 'mock-token');
  };

  const handleRegister = () => {
    // 회원가입 페이지로 이동 또는 모달 열기
    console.log('회원가입');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border-subtle bg-background-primary/95 backdrop-blur supports-[backdrop-filter]:bg-background-primary/60',
        className,
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* 로고 */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              {/* 새김 로고 이미지 */}
              <div className="w-full h-full rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 배경 */}
                  <rect width="100" height="100" fill="#F5F1EC" />

                  {/* 새 몸체 - 더 곡선적이고 자연스럽게 */}
                  <path
                    d="M15 45 C15 35, 25 25, 35 30 C45 35, 55 40, 60 45 C65 50, 65 55, 60 60 C55 65, 45 65, 35 60 C25 55, 15 55, 15 45 Z"
                    fill="#FF8A65"
                  />

                  {/* 새의 윗부분/머리 */}
                  <path
                    d="M15 45 C10 35, 15 25, 25 25 C35 25, 40 35, 35 45 C30 50, 20 50, 15 45 Z"
                    fill="#FF8A65"
                  />

                  {/* 새의 눈 */}
                  <circle cx="25" cy="35" r="2" fill="white" />
                  <circle cx="25" cy="35" r="1" fill="#333" />

                  {/* 새의 부리 */}
                  <path d="M15 40 L8 38 L15 36 Z" fill="#FF7043" />

                  {/* 새의 배 부분 곡선 */}
                  <path
                    d="M25 50 C30 52, 35 52, 40 50"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.7"
                  />

                  {/* 펜 - 대각선으로 뻗어나가는 형태 */}
                  <path
                    d="M45 35 L75 65"
                    stroke="#60B2B8"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* 펜촉 */}
                  <path d="M75 65 L73 68 L77 68 Z" fill="#307D7A" />

                  {/* 펜 클립 */}
                  <rect
                    x="58"
                    y="47"
                    width="2"
                    height="6"
                    fill="#307D7A"
                    transform="rotate(45 59 50)"
                  />

                  {/* 큰 잎사귀 */}
                  <path
                    d="M75 20 C85 10, 95 15, 95 30 C95 45, 85 50, 75 40 Z"
                    fill="#60B2B8"
                  />

                  {/* 작은 잎사귀 */}
                  <path
                    d="M78 12 C85 5, 90 10, 90 18 C90 26, 85 28, 78 22 Z"
                    fill="#7DC4CA"
                  />

                  {/* 잎맥 */}
                  <path
                    d="M80 30 Q85 25, 90 30"
                    stroke="#307D7A"
                    strokeWidth="0.8"
                    fill="none"
                  />
                  <path
                    d="M80 18 Q83 15, 86 18"
                    stroke="#60B2B8"
                    strokeWidth="0.8"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-h4 font-bold text-text-primary">새김</h1>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-body text-text-secondary">
                안녕하세요, {user?.name}님
              </span>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleLogin}>
                로그인
              </Button>
              <Button variant="secondary" size="sm" onClick={handleRegister}>
                회원가입
              </Button>
              <ThemeToggle />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
