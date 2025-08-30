import { create } from 'zustand';
import {
  DiaryEntry,
  DiaryListEntry,
  DiaryFilters,
  CalendarDateRange,
} from '@/types/diary';
import {
  createInitialErrorState,
  ErrorState,
  ErrorActions,
  handleApiError,
} from '@/lib/store-helpers';
import { DiaryService } from '@/services/diary-service';
import { ImageStorageService } from '@/services/storage-service';
import { getLogger } from '@/lib/logger';

const _logger = getLogger('diary-store');

// 스토어 상태 인터페이스
interface DiaryState extends ErrorState {
  diaries: DiaryListEntry[];
  currentDiary: DiaryEntry | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  deletedImageIds: Set<string>;
}

// 스토어 액션 인터페이스
interface DiaryActions extends ErrorActions {
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
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  addDeletedImageId: (imageId: string) => void;
  removeDeletedImageId: (imageId: string) => void;
  clearDeletedImageIds: () => void;
}

// 초기 상태
const createInitialState = (): DiaryState => ({
  ...createInitialErrorState(),
  diaries: [],
  currentDiary: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  deletedImageIds: ImageStorageService.getDeletedImageIds(),
});

// 스토어 생성
export const useDiaryStore = create<DiaryState & DiaryActions>((set, get) => ({
  // 초기 상태
  ...createInitialState(),

  // 에러 처리 액션들
  clearError: () => set((state) => ({ ...state, error: null })),
  setLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
  setError: (error) => set((state) => ({ ...state, error, isLoading: false })),

  // 다이어리 목록 조회
  fetchDiaries: async (filters?: DiaryFilters) => {
    const { setLoading, setError } = get();
    setLoading(true);

    try {
      const filtersWithPagination = {
        ...filters,
        page: filters?.page || get().currentPage,
        page_size: filters?.page_size || get().pageSize,
      };

      const result = await DiaryService.getDiaries(filtersWithPagination);

      set((state) => ({
        ...state,
        diaries: result.diaries,
        totalCount: result.totalCount,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, '다이어리 목록 조회');
      setError(errorMessage);
    }
  },

  // 특정 다이어리 조회
  fetchDiary: async (id: string) => {
    const { setLoading, setError } = get();
    setLoading(true);

    try {
      const diary = await DiaryService.getDiary(id);

      set((state) => ({
        ...state,
        currentDiary: diary,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, '다이어리 조회');
      setError(errorMessage);
    }
  },

  // 캘린더용 다이어리 조회
  fetchCalendarDiaries: async (dateRange: CalendarDateRange) => {
    const { setLoading, setError } = get();
    setLoading(true);

    try {
      const diaries = await DiaryService.getCalendarDiaries(dateRange);

      set((state) => ({
        ...state,
        diaries,
        totalCount: diaries.length,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, '캘린더 다이어리 조회');
      setError(errorMessage);
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
    const { setLoading, setError } = get();
    setLoading(true);

    try {
      const diaryData = await DiaryService.updateDiary(id, data);

      set((state) => ({
        ...state,
        currentDiary: diaryData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, '다이어리 수정');
      setError(errorMessage);
    }
  },

  // 다이어리 삭제
  deleteDiary: async (id: string) => {
    const { setLoading, setError } = get();
    setLoading(true);

    try {
      await DiaryService.deleteDiary(id);

      // 삭제 후 목록에서 해당 다이어리 제거
      const currentState = get();
      const updatedDiaries = currentState.diaries.filter(
        (diary) => diary.id.toString() !== id,
      );

      set((state) => ({
        ...state,
        diaries: updatedDiaries,
        totalCount: currentState.totalCount - 1,
        currentDiary:
          currentState.currentDiary?.id.toString() === id
            ? null
            : currentState.currentDiary,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, '다이어리 삭제');
      setError(errorMessage);
    }
  },

  // 페이지 관리
  setPage: (page: number) => set((state) => ({ ...state, currentPage: page })),
  setPageSize: (size: number) => set((state) => ({ ...state, pageSize: size })),

  // 이미지 삭제 ID 관리 (서비스 레이어 사용)
  addDeletedImageId: (imageId: string) => {
    const success = ImageStorageService.addDeletedImageId(imageId);
    if (success) {
      set((state) => ({
        ...state,
        deletedImageIds: ImageStorageService.getDeletedImageIds(),
      }));
    }
  },

  removeDeletedImageId: (imageId: string) => {
    const success = ImageStorageService.removeDeletedImageId(imageId);
    if (success) {
      set((state) => ({
        ...state,
        deletedImageIds: ImageStorageService.getDeletedImageIds(),
      }));
    }
  },

  clearDeletedImageIds: () => {
    const success = ImageStorageService.clearDeletedImageIds();
    if (success) {
      set((state) => ({
        ...state,
        deletedImageIds: new Set(),
      }));
    }
  },
}));
