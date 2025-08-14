'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/write', label: '글쓰기' },
    { href: '/list', label: '목록' },
    { href: '/calendar', label: '캘린더' },
    { href: '/notifications', label: '알림' },
    { href: '/profile', label: '마이페이지' },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors font-medium ${
                    isActive
                      ? 'bg-sage-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium text-base">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 프로필 섹션 - 고정 위치 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sage-50 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sage-70 dark:text-white text-sm font-medium">
              N
            </span>
          </div>
          <span className="text-gray-800 dark:text-gray-200 font-medium">
            프로필
          </span>
        </div>
      </div>
    </div>
  );
}
