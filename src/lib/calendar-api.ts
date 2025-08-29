import { DiaryListEntry } from '@/types/diary';
import { CalendarApiResponse, DateRange } from '@/types/calendar';
import { getLogger } from '@/lib/logger';
import { useDiaryStore } from '@/stores/diary';

const logger = getLogger('CalendarApi');

export class CalendarApi {
  private static baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  static async fetchCalendarData(
    dateRange: DateRange,
  ): Promise<DiaryListEntry[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/diary/calendar?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const result: CalendarApiResponse = await response.json();
        logger.info('달력 데이터 로드 성공', { result });

        if (result.data && Array.isArray(result.data)) {
          useDiaryStore.setState({
            diaries: result.data,
            totalCount: result.data.length,
            isLoading: false,
            error: null,
          });
          return result.data;
        }
        return [];
      }

      if (response.status === 401) {
        logger.warn('인증 실패, 로그인 페이지로 리다이렉트');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      throw new Error(`API call failed with status: ${response.status}`);
    } catch (error) {
      logger.error('달력 API 호출 실패', { error });
      useDiaryStore.setState({
        error: '캘린더 데이터를 불러오는데 실패했습니다.',
        isLoading: false,
      });
      throw error;
    }
  }
}
