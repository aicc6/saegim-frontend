'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface PageHeaderProps {
  title: string;
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
      className={`border-b px-12 py-4 ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-sage-20'
      } ${className}`}
    >
      <div className="max-w-full mx-auto flex items-center justify-between">
        {/* 좌측: 페이지 제목 */}
        <div className="flex flex-col">
          <h1
            className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-sage-100'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-sage-70'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* 우측: 액션 버튼들 */}
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
