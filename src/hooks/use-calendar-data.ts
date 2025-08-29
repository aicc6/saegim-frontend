import { useEffect } from 'react';
import { useDiaryStore } from '@/stores/diary';
import { CalendarApi } from '@/lib/calendar-api';
import { DateUtils } from '@/lib/date-utils';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useCalendarData');

export const useCalendarData = (year: number, month: number) => {
  const { diaries, isLoading, error, deletedImageIds } = useDiaryStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const dateRange = DateUtils.createDateRange(year, month);
        logger.debug('달력 데이터 로딩 시작', { year, month, dateRange });

        await CalendarApi.fetchCalendarData(dateRange);
      } catch (error) {
        logger.error('달력 데이터 로딩 실패', { error });
      }
    };

    loadData();
  }, [year, month]);

  useEffect(() => {
    logger.debug('달력 데이터 상태', {
      diariesCount: diaries.length,
      isLoading,
      error,
      deletedImageIdsCount: deletedImageIds.size,
    });
  }, [diaries, isLoading, error, deletedImageIds]);

  return {
    diaries,
    isLoading,
    error,
    deletedImageIds,
  };
};
