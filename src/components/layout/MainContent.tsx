'use client';

import { useSidebar } from '@/contexts/sidebar-context';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={`pb-16 lg:pb-0 transition-all duration-300 bg-sage-10 dark:bg-gray-900 ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}
    >
      {children}
    </main>
  );
}
