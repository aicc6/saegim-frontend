/**
 * 다이어리 관련 API
 */

import { DiaryListEntry } from '@/types/diary';
import { apiClient } from './client';

// 다이어리 API 엔드포인트
export const diaryApi = {
  // 다이어리 목록 조회
  getDiaries: (params?: {
    page?: number;
    page_size?: number;
    emotion?: string;
    start_date?: string;
    end_date?: string;
    sort_order?: string;
    category_id?: string | null;
    searchTerm?: string;
  }) => {
    const stringParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          stringParams[key] = String(value);
        }
      });
    }
    return apiClient.get<DiaryListEntry[]>('/api/diary', stringParams);
  },

  // 특정 다이어리 조회
  getDiary: (id: string) => apiClient.get(`/api/diary/${id}`),

  // 다이어리 수정
  updateDiary: (
    id: string,
    data: {
      title?: string;
      content?: string;
      user_emotion?: string;
      is_public?: boolean;
      keywords?: string[];
      category_id?: string | null;
    },
  ) => apiClient.put(`/api/diary/${id}`, data),

  // 캘린더용 다이어리 조회 (JWT 기반, user_id 파라미터 제거)
  getCalendarDiaries: (startDate: string, endDate: string) =>
    apiClient.get('/api/diary/calendar', {
      start_date: startDate,
      end_date: endDate,
    }),

  // 다이어리 생성
  createDiary: async (data: {
    title?: string;
    content: string;
    user_emotion?: string;
    ai_generated_text?: string;
    ai_emotion?: string;
    ai_emotion_confidence?: number;
    keywords?: string[];
    diary_date?: string; // 다이어리 작성 날짜 (YYYY-MM-DD 형식)
    is_public?: boolean;
    category_id?: string | null;
    uploaded_images?: Array<{
      file_id: string;
      original_url: string;
      thumbnail_url: string;
      mime_type: string;
      file_size: number;
      filename: string;
    }> | null;
  }) => apiClient.post('/api/diary', data),

  // 다이어리 삭제
  deleteDiary: (id: string) => apiClient.delete(`/api/diary/${id}`),
};
