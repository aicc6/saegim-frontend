/**
 * 캘린더 관련 API
 */

import { DiaryListEntry } from '@/types/diary';
import { apiClient } from './client';

// 캘린더 관련 API 엔드포인트
export const calendarApi = {
  // 캘린더용 다이어리 데이터 조회
  fetchCalendarData: async (startDate: string, endDate: string) => {
    return apiClient.get<DiaryListEntry[]>('/api/diary/calendar', {
      start_date: startDate,
      end_date: endDate,
    });
  },
};
