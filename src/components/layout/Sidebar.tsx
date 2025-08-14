'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  monthlyData?: {
    totalEntries: number;
    topEmotion: {
      emoji: string;
      name: string;
    } | null;
  };
}

const menuItems = [
  {
    id: 'write',
    label: '글쓰기',
    icon: '✏️',
    href: '/write',
    description: '새로운 일기 작성',
  },
  {
    id: 'list',
    label: '글목록',
    icon: '📝',
    href: '/list',
    description: '작성한 일기 목록',
  },
  {
    id: 'calendar',
    label: '캘린더',
    icon: '📅',
    href: '/calendar',
    description: '달력으로 보는 감정 기록',
  },
  {
    id: 'notifications',
    label: '알림',
    icon: '🔔',
    href: '/notifications',
    description: '알림 및 소식',
  },
];

export function Sidebar({ className, monthlyData }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 월 정보
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background-secondary border-r border-border-subtle',
        className,
      )}
    >
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center p-3 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'text-text-primary'
                    : 'text-text-primary hover:bg-background-hover hover:text-text-primary',
                )}
                style={
                  isActive
                    ? {
                        border: '2px solid #B2C5B8',
                        backgroundColor: '#F9F5EF',
                        color: '#000000', // 다크모드에서도 검은색 글씨
                      }
                    : undefined
                }
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <div className="flex flex-col items-start">
                  <span
                    className="font-medium"
                    style={isActive ? { color: '#000000' } : undefined}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      'text-caption transition-colors',
                      isActive
                        ? 'text-text-secondary'
                        : 'text-text-secondary group-hover:text-text-primary',
                    )}
                    style={isActive ? { color: '#666666' } : undefined}
                  >
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* 사용자 통계 */}
        <div className="mt-8 p-4 bg-background-primary rounded-lg border border-border-subtle">
          <h3 className="text-body-small font-medium text-text-primary mb-2">
            {currentMonth}월의 기록
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-caption text-text-secondary">총 글 수</span>
              <span className="text-body-small font-medium text-interactive-primary">
                {monthlyData?.totalEntries || '0'}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-caption text-text-secondary">
                가장 많은 감정
              </span>
              <span className="text-body-small">
                {monthlyData?.topEmotion?.emoji} {monthlyData?.topEmotion?.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
