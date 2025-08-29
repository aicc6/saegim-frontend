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
import {
  isValidDiaryEntry,
  isValidDiaryList,
  validateApiResponse,
} from '@/lib/type-guards';
import { getLogger } from '../lib/logger';

const logger = getLogger('diary');

interface DiaryState {
  // 상태
  diaries: DiaryListEntry[];
  currentDiary: DiaryEntry | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  deletedImageIds: Set<string>; // 삭제된 이미지 ID 추적

  // 액션
  fetchDiaries: (filters?: DiaryFilters) => Promise<void>;
  fetchDiary: (id: string) => Promise<void>;
  fetchCalendarDiaries: (dateRange: CalendarDateRange) => Promise<void>;
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
  deleteDiary: (id: string) => Promise<void>;
  clearError: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  addDeletedImageId: (imageId: string) => void; // 이미지 삭제 ID 추가
  removeDeletedImageId: (imageId: string) => void; // 이미지 삭제 ID 제거
  clearDeletedImageIds: () => void; // 모든 삭제된 이미지 ID 초기화
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
  deletedImageIds: new Set(
    JSON.parse(localStorage.getItem('deletedImageIds') || '[]'),
  ), // localStorage에서 복원

  // 다이어리 목록 조회
  fetchDiaries: async (filters?: DiaryFilters) => {
    try {
      set({ isLoading: true, error: null });

      const params: Record<string, string> = {
        page: (filters?.page || get().currentPage).toString(),
        page_size: (filters?.page_size || get().pageSize).toString(),
      };

      if (filters?.searchTerm) params.searchTerm = filters.searchTerm;
      if (filters?.emotion) params.emotion = filters.emotion;
      if (filters?.is_public !== undefined)
        params.is_public = filters.is_public.toString();
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;
      if (filters?.sort_order) params.sort_order = filters.sort_order;

      const response = await diaryApi.getDiaries(params);

      // 타입 안전성을 보장하는 API 응답 처리
      const diaries = validateApiResponse(response.data, isValidDiaryList);

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

      // 타입 안전성을 보장하는 API 응답 처리
      const diary = isValidDiaryEntry(response.data) ? response.data : null;

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
  fetchCalendarDiaries: async (dateRange: CalendarDateRange) => {
    try {
      logger.debug('캘린더 다이어리 조회 시작', {
        dateRange,
      });

      set({ isLoading: true, error: null });

      const response = await diaryApi.getCalendarDiaries(
        dateRange.startDate,
        dateRange.endDate,
      );

      logger.debug('API 응답', {
        response,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });

      // 타입 안전성을 보장하는 API 응답 처리
      const diaries = validateApiResponse(response.data, isValidDiaryList);

      logger.info('처리된 데이터', {
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
      logger.error('에러 발생', { error });
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
      const diaryData = validateApiResponse(response.data, isValidDiaryEntry);
      set({ currentDiary: diaryData, isLoading: false, error: null });
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

  // 다이어리 삭제
  deleteDiary: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await diaryApi.deleteDiary(id);

      // 삭제 후 목록에서 해당 다이어리 제거
      const currentState = get();
      const updatedDiaries = currentState.diaries.filter(
        (diary) => diary.id.toString() !== id,
      );

      set({
        diaries: updatedDiaries,
        totalCount: currentState.totalCount - 1,
        currentDiary:
          currentState.currentDiary?.id.toString() === id
            ? null
            : currentState.currentDiary,
        isLoading: false,
        error: null,
      });

      logger.info('다이어리 삭제 성공', { id });
    } catch (error) {
      logger.error('다이어리 삭제 실패', { id, error });
      set({
        error:
          error instanceof Error
            ? error.message
            : '다이어리를 삭제하는데 실패했습니다.',
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

  // 이미지 삭제 ID 추가
  addDeletedImageId: (imageId: string) => {
    set((state) => {
      const newDeletedImageIds = new Set([...state.deletedImageIds, imageId]);
      // localStorage에 저장
      localStorage.setItem(
        'deletedImageIds',
        JSON.stringify(Array.from(newDeletedImageIds)),
      );
      return { deletedImageIds: newDeletedImageIds };
    });
  },

  // 이미지 삭제 ID 제거
  removeDeletedImageId: (imageId: string) => {
    set((state) => {
      const newDeletedImageIds = new Set(
        [...state.deletedImageIds].filter((id) => id !== imageId),
      );
      // localStorage에 저장
      localStorage.setItem(
        'deletedImageIds',
        JSON.stringify(Array.from(newDeletedImageIds)),
      );
      return { deletedImageIds: newDeletedImageIds };
    });
  },

  // 모든 삭제된 이미지 ID 초기화
  clearDeletedImageIds: () => {
    // localStorage에서도 제거
    localStorage.removeItem('deletedImageIds');
    set({ deletedImageIds: new Set() });
  },
}));
