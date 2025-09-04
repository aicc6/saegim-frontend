import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  className?: string;
}

export const CalendarHeader = ({
  year,
  month,
  onNavigateMonth,
  className,
}: CalendarHeaderProps) => (
  <div
    className={cn(
      'flex items-center justify-between p-4 border-b border-border-subtle',
      className,
    )}
  >
    <button
      onClick={() => onNavigateMonth('prev')}
      className="group flex items-center justify-center w-12 h-10 hover:bg-sage-20 rounded-full transition-all duration-200 hover:scale-105"
      title="이전 달"
    >
      <svg
        className="w-5 h-5 text-sage-600 dark:text-sage-400 group-hover:text-sage-700 dark:group-hover:text-sage-300 group-hover:animate-pulse transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>

    <h2 className="text-h3 font-bold text-xl flex items-center gap-2">
      {year}년 {month + 1}월
    </h2>

    <button
      onClick={() => onNavigateMonth('next')}
      className="group flex items-center justify-center w-12 h-10 hover:bg-sage-20 rounded-full transition-all duration-200 hover:scale-105"
      title="다음 달"
    >
      <svg
        className="w-5 h-5 text-sage-600 dark:text-sage-400 group-hover:text-sage-700 dark:group-hover:text-sage-300 group-hover:animate-pulse transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>
);
