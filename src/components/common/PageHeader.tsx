'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className={`flex border-b px-4 sm:px-6 lg:px-12 h-16 sm:h-18 items-center sticky top-0 z-30 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      } ${className}`}
    >
      <div className="max-w-full flex items-center justify-between w-full">
        {/* 좌측: 페이지 제목 */}
        <div className="flex flex-col flex-1 min-w-0">
          <h1
            className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${
              isDark ? 'text-white' : 'text-sage-100'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-xs sm:text-sm mt-1 truncate ${
                isDark ? 'text-gray-400' : 'text-sage-70'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* 우측: 액션 버튼들 */}
        {actions && (
          <div className="flex items-center space-x-2 ml-4">{actions}</div>
        )}
      </div>
    </div>
  );
}
