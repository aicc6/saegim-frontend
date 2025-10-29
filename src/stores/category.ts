/**
 * 다이어리 카테고리 상태 관리 스토어
 */

import { create } from 'zustand';
import { categoryApi } from '@/lib/api/category';
import {
  isValidDiaryCategory,
  isValidDiaryCategoryList,
  validateApiResponse,
} from '@/lib/type-guards';
import { getLogger } from '@/lib/logger';
import { DiaryCategory } from '@/types/category';

const logger = getLogger('category');

interface CategoryState {
  categories: DiaryCategory[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchCategories: (force?: boolean) => Promise<void>;
  createCategory: (name: string) => Promise<DiaryCategory | null>;
  updateCategory: (id: string, name: string) => Promise<DiaryCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  hasFetched: false,

  fetchCategories: async (force = false) => {
    const { hasFetched, isLoading } = get();
    if (!force && (hasFetched || isLoading)) return;

    try {
      set({ isLoading: true, error: null });
      const response = await categoryApi.getCategories();
      const categories = validateApiResponse(
        response.data,
        isValidDiaryCategoryList,
      );
      set({
        categories,
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      logger.error('카테고리 목록 조회 실패', { error });
      set({
        error:
          error instanceof Error
            ? error.message
            : '카테고리를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  },

  createCategory: async (name: string) => {
    if (!name.trim()) {
      set({ error: '카테고리 이름을 입력해주세요.' });
      return null;
    }

    try {
      set({ isSubmitting: true, error: null });
      const response = await categoryApi.createCategory({ name: name.trim() });
      const category = validateApiResponse(response.data, isValidDiaryCategory);
      set((state) => ({
        categories: [category, ...state.categories],
        isSubmitting: false,
      }));
      return category;
    } catch (error) {
      logger.error('카테고리 생성 실패', { error });
      set({
        error:
          error instanceof Error
            ? error.message
            : '카테고리를 생성하는데 실패했습니다.',
        isSubmitting: false,
      });
      return null;
    }
  },

  updateCategory: async (id: string, name: string) => {
    if (!name.trim()) {
      set({ error: '카테고리 이름을 입력해주세요.' });
      return null;
    }

    try {
      set({ isSubmitting: true, error: null });
      const response = await categoryApi.updateCategory(id, {
        name: name.trim(),
      });
      const updatedCategory = validateApiResponse(
        response.data,
        isValidDiaryCategory,
      );
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? updatedCategory : category,
        ),
        isSubmitting: false,
      }));
      return updatedCategory;
    } catch (error) {
      logger.error('카테고리 수정 실패', { id, error });
      set({
        error:
          error instanceof Error
            ? error.message
            : '카테고리 이름을 수정하는데 실패했습니다.',
        isSubmitting: false,
      });
      return null;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      set({ isSubmitting: true, error: null });
      await categoryApi.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        isSubmitting: false,
      }));
      return true;
    } catch (error) {
      logger.error('카테고리 삭제 실패', { id, error });
      set({
        error:
          error instanceof Error
            ? error.message
            : '카테고리를 삭제하는데 실패했습니다.',
        isSubmitting: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
