'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenTool, Grid3X3, Calendar, User, Menu, X, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: '글쓰기', href: '/', icon: PenTool },
  { name: '글목록', href: '/list', icon: Grid3X3 },
  { name: '캘린더', href: '/calendar', icon: Calendar },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-sage-20">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* 로고 */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sage-50 rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-sage-100" />
              </div>
              <span className="text-xl font-bold text-sage-100">새김</span>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-sage-20 text-sage-100'
                      : 'text-sage-70 hover:bg-sage-10 hover:text-sage-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 사용자 프로필 */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-sage-20">
            <Link href="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start text-sage-70 hover:text-sage-100"
              >
                <User className="mr-3 h-5 w-5" />
                프로필
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 모바일 헤더 */}
      <div className="lg:hidden bg-white border-b border-sage-20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sage-50 rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-sage-100" />
            </div>
            <span className="text-xl font-bold text-sage-100">새김</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
        <div className="lg:hidden bg-white border-b border-sage-20">
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
                      ? 'bg-sage-20 text-sage-100'
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sage-20 px-4 py-2">
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
                    ? 'text-sage-100'
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
