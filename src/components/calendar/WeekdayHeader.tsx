'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export const WeekdayHeader = () => {
  const { t } = useTranslation();
  const weekdays = useMemo(() => {
    const result = t('calendar.weekdays.short', { returnObjects: true });
    return Array.isArray(result)
      ? (result as string[])
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [t]);

  return (
    <div className="grid grid-cols-7 border-b border-border-subtle">
      {weekdays.map((day, index) => (
        <div
          key={`${day}-${index}`}
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
};
