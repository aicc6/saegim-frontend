'use client';

import { ReactNode } from 'react';

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
  return (
    <div
      className={`bg-white dark:bg-gray-900 border-b border-sage-20 dark:border-gray-700 px-6 py-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* 좌측: 페이지 제목 */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-sage-100 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-sage-70 dark:text-gray-400 mt-1">
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
