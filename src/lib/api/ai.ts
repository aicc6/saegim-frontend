/**
 * AI 관련 API
 */

import { apiClient } from './client';

export interface AIGenerationResult {
  ai_generated_text: string;
  ai_emotion: string;
  ai_emotion_confidence: number;
  keywords: string[];
  tokens_used: number;
  session_id: string;
}

export interface OriginalUserInputResponse {
  original_input: string;
}

// AI 관련 API 엔드포인트
export const aiApi = {
  // AI 텍스트 재생성 (session_id 기반)
  regenerate: async (sessionId: string) => {
    return apiClient.post(`/api/ai/regenerate/${sessionId}`, {});
  },

  // 원본 사용자 입력 조회
  getOriginalUserInput: async (sessionId: string) => {
    return apiClient.get<OriginalUserInputResponse>(
      `/api/ai/session/${sessionId}/original-input`,
    );
  },

  // AI 텍스트 생성
  generateText: async (data: {
    prompt: string;
    style: string;
    length: string;
    emotion?: string;
    regeneration_count?: number;
    sessionId?: string;
    uploaded_images?: Array<{
      file_id: string;
      original_url: string;
      thumbnail_url: string;
      mime_type: string;
      file_size: number;
      filename: string;
    }> | null;
  }) => {
    const requestBody: Record<string, unknown> = {
      prompt: data.prompt,
      style: data.style,
      length: data.length,
      emotion: data.emotion || '',
      regeneration_count: data.regeneration_count || 0,
    };

    // sessionId가 있을 때만 추가
    if (data.sessionId) {
      requestBody.sessionId = data.sessionId;
      requestBody.session_id = data.sessionId;
    }

    // uploaded_images가 있을 때만 추가
    if (data.uploaded_images) {
      requestBody.uploaded_images = data.uploaded_images;
    }

    return apiClient.post<AIGenerationResult>('/api/ai/generate', requestBody);
  },

  // AI 텍스트 스트리밍 생성 (Raw fetch for streaming)
  generateTextStream: async (data: {
    prompt: string;
    style: string;
    length: string;
    emotion?: string;
    sessionId?: string;
    uploaded_images?: Array<{
      file_id: string;
      original_url: string;
      thumbnail_url: string;
      mime_type: string;
      file_size: number;
      filename: string;
    }> | null;
  }): Promise<Response> => {
    const requestBody: Record<string, unknown> = {
      prompt: data.prompt,
      style: data.style,
      length: data.length,
      emotion: data.emotion || '',
      ...(data.sessionId && { session_id: data.sessionId }),
      ...(data.uploaded_images && { uploaded_images: data.uploaded_images }),
    };

    // 스트리밍은 apiClient가 아닌 직접 fetch를 사용
    const response = await fetch(
      'http://localhost:8000/api/ai/generate/stream',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // 쿠키 기반 인증
      },
    );

    return response;
  },
};
