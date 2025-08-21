'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  PenTool,
  Grid3X3,
  Calendar,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: '글쓰기', href: '/', icon: PenTool },
  { name: '글목록', href: '/list', icon: Grid3X3 },
  { name: '캘린더', href: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // 백엔드에 로그아웃 요청
      await authApi.logout();
      
      // 클라이언트 상태 정리
      logout();
      
      // 성공 토스트 표시
      toast({
        title: '로그아웃 완료',
        description: '안전하게 로그아웃되었습니다.',
        variant: 'default',
      });
      
      // 로그인 페이지로 리다이렉트
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 에러가 발생해도 클라이언트 상태는 정리하고 로그인 페이지로 이동
      logout();
      
      // 에러 토스트 표시
      toast({
        title: '로그아웃 완료',
        description: '클라이언트 상태가 정리되었습니다.',
        variant: 'default',
      });
      
      router.push('/login');
    }
  };

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r transition-all duration-300 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        } ${
          isDark
            ? 'lg:bg-gray-900 lg:border-gray-700'
            : 'lg:bg-white lg:border-sage-20'
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* 사용자 프로필 */}
          <div
            className={`flex-shrink-0 h-18 border-b flex items-center ${
              isCollapsed ? 'px-2' : 'px-4'
            } ${isDark ? 'border-gray-700' : 'border-sage-20'}`}
          >
            {isCollapsed ? (
              <div className="flex flex-col space-y-1 w-full">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full p-2 ${
                      isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-sage-70 hover:text-sage-100'
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-full p-2 ${
                    isDark
                      ? 'text-gray-300 hover:text-red-400'
                      : 'text-sage-70 hover:text-red-500'
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    className={`justify-start ${
                      isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-sage-70 hover:text-sage-100'
                    }`}
                  >
                    <User className="mr-3 h-5 w-5" />
                    프로필
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`p-2 ${
                    isDark
                      ? 'text-gray-300 hover:text-red-400'
                      : 'text-sage-70 hover:text-red-500'
                  }`}
                  title="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 네비게이션 메뉴 */}
          <nav
            className={`flex-1 px-2 py-4 space-y-1 ${
              isCollapsed ? 'px-1' : 'px-2'
            }`}
          >
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-sage-20 text-sage-100'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 토글 버튼 - 프로필 영역과 수평 정렬 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden lg:block fixed top-6 z-[60] p-2 rounded-full shadow-md transition-all duration-300 ${
          isDark
            ? 'bg-gray-800 border-gray-600 text-gray-300 hover:text-white'
            : 'bg-white border-sage-20 text-sage-70 hover:text-sage-100'
        } border`}
        style={{
          top: '1rem', // 프로필 버튼과 수평 정렬
          left: isCollapsed ? '3rem' : '15rem', // 접힌 상태: 사이드바 우측 경계 중앙(48px), 펼친 상태: 사이드바 우측 경계(240px)
        }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* 모바일 헤더 */}
      <div
        className={`lg:hidden border-b px-4 py-3 ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-sage-100'
              }`}
            >
              새김
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={isDark ? 'text-gray-300 hover:text-white' : ''}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div
          className={`lg:hidden border-b ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
          }`}
        >
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {/* 프로필과 로그아웃 */}
            <div className="flex items-center justify-between px-3 py-2">
              <Link
                href="/profile"
                className={`group flex items-center text-base font-medium rounded-md transition-colors ${
                  pathname === '/profile'
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-sage-20 text-sage-100'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="mr-4 h-6 w-6" />
                프로필
              </Link>
              
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className={`group flex items-center p-2 text-base font-medium rounded-md transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                    : 'text-sage-70 hover:bg-sage-10 hover:text-red-500'
                }`}
                title="로그아웃"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
            
            {/* 기존 네비게이션 링크들 */}
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-sage-20 text-sage-100'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-4 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* 모바일 하단 네비게이션 */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 border-t px-4 py-2 ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
        }`}
      >
        <nav className="flex justify-around">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-sage-100'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-sage-60 hover:text-sage-100'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
