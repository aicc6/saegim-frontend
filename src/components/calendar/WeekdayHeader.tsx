import { cn } from '@/lib/utils';

export const WeekdayHeader = () => (
  <div className="grid grid-cols-7 border-b border-border-subtle">
    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
      <div
        key={day}
        className={cn(
          'p-3 text-center text-body-small font-medium',
          index === 0
            ? 'text-error'
            : index === 6
              ? 'text-interactive-primary'
              : 'text-text-secondary',
        )}
      >
        {day}
      </div>
    ))}
  </div>
);
