import { useState, useCallback } from 'react';
import { getLogger } from '@/lib/logger';
import { DateUtils } from '@/lib/date-utils';

const logger = getLogger('useCalendarNavigation');

export const useCalendarNavigation = (
  initialDate?: Date,
  onDateChange?: (date: Date) => void,
) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const navigateMonth = useCallback(
    (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);

      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }

      setCurrentDate(newDate);
      onDateChange?.(newDate);

      logger.debug('월 변경', {
        direction,
        oldDate: currentDate,
        newDate,
        oldMonth: currentDate.getMonth() + 1,
        newMonth: newDate.getMonth() + 1,
      });
    },
    [currentDate, onDateChange],
  );

  const handleDateClick = useCallback(
    (dateStr: string, onDateSelect?: (date: string) => void) => {
      const clickedDate = new Date(dateStr);

      if (!DateUtils.isSameMonth(clickedDate, currentDate)) {
        const newDate = new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          1,
        );
        setCurrentDate(newDate);
        onDateChange?.(newDate);
      }

      setSelectedDate(dateStr);
      onDateSelect?.(dateStr);

      // Scroll to diary section
      setTimeout(() => {
        scrollToDiarySection(dateStr);
      }, 800);
    },
    [currentDate, onDateChange],
  );

  const goToToday = useCallback(
    (onDateSelect?: (date: string) => void) => {
      const today = new Date();
      const todayStr = DateUtils.getTodayString();

      if (!DateUtils.isSameMonth(today, currentDate)) {
        setCurrentDate(today);
      }

      onDateChange?.(today);
      setSelectedDate(todayStr);
      onDateSelect?.(todayStr);

      setTimeout(() => {
        scrollToTodayElement(todayStr);
      }, 500);
    },
    [currentDate, onDateChange],
  );

  return {
    currentDate,
    selectedDate,
    setCurrentDate,
    setSelectedDate,
    navigateMonth,
    handleDateClick,
    goToToday,
  };
};

function scrollToDiarySection(dateStr: string) {
  const recordTitle = Array.from(document.querySelectorAll('h3')).find(
    (h3) =>
      h3.textContent?.includes(dateStr) && h3.textContent?.includes('기록'),
  );

  if (recordTitle) {
    const diarySection =
      recordTitle.closest('div[class*="flex"]') || recordTitle.closest('div');

    if (diarySection) {
      const rect = diarySection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const scrollTop =
        window.pageYOffset + rect.top - windowHeight / 2 + rect.height / 2;

      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }
}

function scrollToTodayElement(todayStr: string) {
  const todayElement = document.querySelector(`[data-date="${todayStr}"]`);

  if (todayElement) {
    const rect = todayElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const scrollTop =
      window.pageYOffset + rect.top - windowHeight / 2 + rect.height / 2;
    const scrollLeft =
      window.pageYOffset + rect.left - windowWidth / 2 + rect.width / 2;

    window.scrollTo({
      top: scrollTop,
      left: scrollLeft,
      behavior: 'smooth',
    });
  }
}
