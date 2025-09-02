/**
 * 이미지 관련 API
 */

import { ImageInfo } from '@/types/diary';
import { apiClient, ApiResponse } from './client';

// 이미지 업로드 응답 타입
export interface ImageUploadResponse {
  file_id: string;
  original_url: string;
  thumbnail_url: string;
  mime_type: string;
  file_size: number;
  filename: string;
}

// 단일 이미지 업로드 응답 타입
export interface SingleImageUploadResponse {
  id: string;
  file_path: string;
  thumbnail_path: string;
  mime_type: string;
}

// 이미지 관련 API 엔드포인트
export const imageApi = {
  // 다이어리 이미지 업로드 (FormData 지원)
  uploadDiaryImages: async (
    files: File[],
  ): Promise<ApiResponse<ImageUploadResponse[]>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    return apiClient.upload<ImageUploadResponse[]>(
      '/api/diary/images/upload',
      formData,
    );
  },

  // 특정 다이어리의 이미지 조회
  getDiaryImages: async (
    diaryId: string,
  ): Promise<ApiResponse<ImageInfo[]>> => {
    return apiClient.get<ImageInfo[]>(`/api/diary/${diaryId}/images`);
  },

  // 단일 이미지 업로드 (다이어리에 추가)
  uploadSingleImage: async (
    diaryId: string,
    file: File,
  ): Promise<ApiResponse<SingleImageUploadResponse>> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('diary_id', diaryId);

    return apiClient.upload<SingleImageUploadResponse>(
      `/api/diary/${diaryId}/upload-image`,
      formData,
    );
  },
};
