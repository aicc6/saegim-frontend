'use client';

import { useImperativeHandle, forwardRef, useEffect } from 'react';
import { CalendarProps, CalendarRef } from '@/types/calendar';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { useCalendarDays } from '@/hooks/use-calendar-days';
import { useCalendarNavigation } from '@/hooks/use-calendar-navigation';
import { useImageCarousel } from '@/hooks/use-image-carousel';
import { cn } from '@/lib/utils';
import { CalendarHeader } from './CalendarHeader';
import { WeekdayHeader } from './WeekdayHeader';
import { CalendarGrid } from './CalendarGrid';

export const Calendar = forwardRef<CalendarRef, CalendarProps>(
  ({ className, onDateSelect, onDateChange, currentViewDate }, ref) => {
    // Initialize hooks
    const {
      currentDate,
      selectedDate,
      navigateMonth,
      handleDateClick,
      goToToday,
    } = useCalendarNavigation(currentViewDate, onDateChange);

    const effectiveDate = currentViewDate || currentDate;
    const year = effectiveDate.getFullYear();
    const month = effectiveDate.getMonth();

    const { diaries, isLoading, error, deletedImageIds } = useCalendarData(
      year,
      month,
    );

    const calendarDays = useCalendarDays(
      year,
      month,
      diaries,
      selectedDate,
      effectiveDate,
      deletedImageIds,
    );

    const { imageIndices, rotateImage } = useImageCarousel();

    // Handle date selection with navigation logic
    const handleInternalDateClick = (dateStr: string) => {
      handleDateClick(dateStr, onDateSelect);
    };

    // Update current date when prop changes
    useEffect(() => {
      if (currentViewDate && onDateChange) {
        onDateChange(currentDate);
      }
    }, [currentDate, currentViewDate, onDateChange]);

    // Expose imperative methods through ref
    useImperativeHandle(ref, () => ({
      goToToday: () => goToToday(onDateSelect),
    }));

    // Loading state
    if (isLoading) {
      return (
        <div
          className={cn(
            'bg-background-primary rounded-lg border border-border-subtle p-8',
            className,
          )}
        >
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500" />
            <span className="ml-2 text-text-secondary">
              다이어리를 불러오는 중...
            </span>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div
          className={cn(
            'bg-background-primary rounded-lg border border-border-subtle p-8',
            className,
          )}
        >
          <div className="text-center text-error">
            <p className="text-lg font-medium">
              데이터를 불러오는데 실패했습니다
            </p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'bg-background-primary rounded-lg border border-border-subtle',
          className,
        )}
      >
        <CalendarHeader
          year={year}
          month={month}
          onNavigateMonth={navigateMonth}
        />

        <WeekdayHeader />

        <CalendarGrid
          days={calendarDays}
          imageIndices={imageIndices}
          onDateClick={handleInternalDateClick}
          onImageRotate={rotateImage}
        />
      </div>
    );
  },
);

Calendar.displayName = 'Calendar';
