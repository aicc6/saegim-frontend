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
      <span className="text-lg group-hover:animate-bounce">◀️</span>
    </button>

    <h2 className="text-h3 font-bold text-text-primary flex items-center gap-2">
      <span className="text-2xl">📅</span>
      {year}년 {month + 1}월
    </h2>

    <button
      onClick={() => onNavigateMonth('next')}
      className="group flex items-center justify-center w-12 h-10 hover:bg-sage-20 rounded-full transition-all duration-200 hover:scale-105"
      title="다음 달"
    >
      <span className="text-lg group-hover:animate-bounce">▶️</span>
    </button>
  </div>
);
