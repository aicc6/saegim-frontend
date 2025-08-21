/**
 * 다이어리 상태 관리 스토어
 */

import { create } from 'zustand';
import { diaryApi } from '@/lib/api';
import {
  DiaryEntry,
  DiaryListEntry,
  DiaryFilters,
  CalendarDateRange,
} from '@/types/diary';

interface DiaryState {
  // 상태
  diaries: DiaryListEntry[];
  currentDiary: DiaryEntry | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;

  // 액션
  fetchDiaries: (filters?: DiaryFilters) => Promise<void>;
  fetchDiary: (id: string) => Promise<void>;
  fetchCalendarDiaries: (
    userId: string,
    dateRange: CalendarDateRange,
  ) => Promise<void>;
  updateDiary: (
    id: string,
    data: {
      title?: string;
      content?: string;
      user_emotion?: string;
      is_public?: boolean;
      keywords?: string[];
    },
  ) => Promise<void>;
  clearError: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  // 초기 상태
  diaries: [],
  currentDiary: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,

  // 다이어리 목록 조회
  fetchDiaries: async (filters?: DiaryFilters) => {
    try {
      set({ isLoading: true, error: null });

      const params: Record<string, string> = {
        page: (filters?.page || get().currentPage).toString(),
        page_size: (filters?.page_size || get().pageSize).toString(),
      };

      if (filters?.emotion) params.emotion = filters.emotion;
      if (filters?.is_public !== undefined)
        params.is_public = filters.is_public.toString();
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;

      const response = await diaryApi.getDiaries(params);

      // 백엔드 API 응답 구조에 맞게 처리
      const diaries = Array.isArray(response.data) ? response.data : [];

      set({
        diaries,
        totalCount: diaries.length,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '다이어리 목록을 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  // 특정 다이어리 조회
  fetchDiary: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await diaryApi.getDiary(id);

      // 타입 안전성 확보
      const diary =
        response.data &&
        typeof response.data === 'object' &&
        'id' in response.data
          ? (response.data as DiaryEntry)
          : null;

      set({
        currentDiary: diary,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '다이어리를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  // 캘린더용 다이어리 조회
  fetchCalendarDiaries: async (
    userId: string,
    dateRange: CalendarDateRange,
  ) => {
    try {
      console.log('🚀 DiaryStore: 캘린더 다이어리 조회 시작', {
        userId,
        dateRange,
      });

      set({ isLoading: true, error: null });

      const response = await diaryApi.getCalendarDiaries(
        userId,
        dateRange.startDate,
        dateRange.endDate,
      );

      console.log('📡 DiaryStore: API 응답', {
        response,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });

      // 백엔드 API 응답 구조에 맞게 처리
      const diaries = Array.isArray(response.data) ? response.data : [];

      console.log('✅ DiaryStore: 처리된 데이터', {
        diariesCount: diaries.length,
        diaries: diaries.slice(0, 3), // 처음 3개만 로그
      });

      set({
        diaries,
        totalCount: diaries.length,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ DiaryStore: 에러 발생', error);
      set({
        error:
          error instanceof Error
            ? error.message
            : '캘린더 다이어리를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  // 다이어리 수정
  updateDiary: async (
    id: string,
    data: {
      title?: string;
      content?: string;
      user_emotion?: string;
      is_public?: boolean;
      keywords?: string[];
    },
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await diaryApi.updateDiary(id, data);
      set({ currentDiary: response.data, isLoading: false, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '다이어리를 수정하는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  // 에러 초기화
  clearError: () => set({ error: null }),

  // 페이지 설정
  setPage: (page: number) => set({ currentPage: page }),

  // 페이지 크기 설정
  setPageSize: (size: number) => set({ pageSize: size }),
}));
