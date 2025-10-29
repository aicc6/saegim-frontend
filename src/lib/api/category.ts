/**
 * 다이어리 카테고리 관련 API 클라이언트
 */

import { DiaryCategory } from '@/types/category';
import { apiClient } from './client';

export const categoryApi = {
  getCategories: () => apiClient.get<DiaryCategory[]>('/api/categories'),
  createCategory: (data: { name: string }) =>
    apiClient.post<DiaryCategory>('/api/categories', data),
  updateCategory: (id: string, data: { name: string }) =>
    apiClient.patch<DiaryCategory>(`/api/categories/${id}`, data),
  deleteCategory: (id: string) =>
    apiClient.delete<null>(`/api/categories/${id}`),
};
