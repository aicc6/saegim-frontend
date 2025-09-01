import { useEffect } from 'react';
import { useDiaryStore } from '@/stores/diary';
import { calendarApi } from '@/lib/api/calendar';
import { DateUtils } from '@/lib/date-utils';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useCalendarData');

export const useCalendarData = (year: number, month: number) => {
  const { diaries, isLoading, error, deletedImageIds } = useDiaryStore();

  useEffect(() => {
    const loadData = async () => {
      // 로딩 상태 설정
      useDiaryStore.setState({ isLoading: true, error: null });

      try {
        const dateRange = DateUtils.createDateRange(year, month);
        logger.debug('달력 데이터 로딩 시작', { year, month, dateRange });

        const response = await calendarApi.fetchCalendarData(
          dateRange.startDate,
          dateRange.endDate,
        );

        if (response.success && response.data) {
          // 스토어 상태 업데이트
          useDiaryStore.setState({
            diaries: response.data,
            isLoading: false,
            error: null,
          });
        } else {
          logger.error('달력 데이터 로딩 실패', { message: response.message });
          useDiaryStore.setState({
            isLoading: false,
            error: response.message || '데이터 로딩에 실패했습니다.',
          });
        }
      } catch (error) {
        logger.error('달력 데이터 로딩 실패', { error });
        useDiaryStore.setState({
          isLoading: false,
          error: '네트워크 오류가 발생했습니다.',
        });
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
