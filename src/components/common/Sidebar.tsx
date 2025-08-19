'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PenTool,
  Grid3X3,
  Calendar,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/sidebar-context';

const navigation = [
  { name: '글쓰기', href: '/', icon: PenTool },
  { name: '글목록', href: '/list', icon: Grid3X3 },
  { name: '캘린더', href: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-sage-20 dark:lg:bg-gray-900 dark:lg:border-gray-700 transition-all duration-300 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* 사용자 프로필 */}
          <div
            className={`flex-shrink-0 p-4 border-b border-sage-20 dark:border-gray-700 ${
              isCollapsed ? 'px-2' : 'px-4'
            }`}
          >

            {isCollapsed ? (
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full p-2 text-sage-70 hover:text-sage-100 dark:text-gray-300 dark:hover:text-white"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/profile">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sage-70 hover:text-sage-100 dark:text-gray-300 dark:hover:text-white"
                >
                  <User className="mr-3 h-5 w-5" />
                  프로필
                </Button>
              </Link>
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
                      ? 'bg-sage-20 text-sage-100 dark:bg-gray-700 dark:text-white'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
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
        className={`hidden lg:block fixed top-6 z-30 p-2 text-sage-70 hover:text-sage-100 bg-white border border-sage-20 rounded-full shadow-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-white transition-all duration-300`}
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
      <div className="lg:hidden bg-white border-b border-sage-20 dark:bg-gray-900 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-sage-100 dark:text-white">
              새김
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="dark:text-gray-300 dark:hover:text-white"
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
        <div className="lg:hidden bg-white border-b border-sage-20 dark:bg-gray-900 dark:border-gray-700">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-sage-20 text-sage-100 dark:bg-gray-700 dark:text-white'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sage-20 dark:bg-gray-900 dark:border-gray-700 px-4 py-2">
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
                    ? 'text-sage-100 dark:text-white'
                    : 'text-sage-60 hover:text-sage-100 dark:text-gray-400 dark:hover:text-white'
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
