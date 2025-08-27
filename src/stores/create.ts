'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/lib/api';

// ===== 타입 정의 =====
export type WritingStyle = 'poem' | 'short_story';
export type LengthOption = 'short' | 'medium' | 'long';
export type EmotionOption = string;

// AI 생성 결과 타입
export interface AIGenerationResult {
  ai_generated_text: string;
  ai_emotion: string;
  ai_emotion_confidence: number;
  keywords: string[];
  tokens_used: number;
  session_id: string; // 생성된 session_id 추가
}

// 설정 타입들
export interface StyleOption {
  value: WritingStyle;
  label: string;
  displayName: string;
}

export interface LengthConfig {
  value: LengthOption;
  label: string;
  displayName: string;
}

export interface CreateConfig {
  styles: StyleOption[];
  lengths: LengthConfig[];
}

// ===== API 에러 처리 =====
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ===== 기본 설정 =====
const DEFAULT_CONFIG: CreateConfig = {
  styles: [
    { value: 'poem', label: '시', displayName: 'poem' },
    { value: 'short_story', label: '단편글', displayName: 'prose' },
  ],
  lengths: [
    { value: 'short', label: '단문', displayName: 'short' },
    { value: 'medium', label: '중문', displayName: 'medium' },
    { value: 'long', label: '장문', displayName: 'long' },
  ],
};

// ===== API 함수들 =====
export async function generateAIText(params: {
  prompt: string;
  style: string;
  length: string;
  emotion?: string;
  regeneration_count?: number;
  sessionId?: string | null;
  images?: File[];
}): Promise<AIGenerationResult> {
  try {
    const {
      prompt,
      style,
      length,
      emotion = '',
      regeneration_count = 0,
      sessionId,
      images,
    } = params;

    // API 요청 본문 구성 (undefined 값은 제외)
    const requestBody: Record<string, unknown> = {
      prompt,
      style,
      length,
      emotion,
      regeneration_count,
    };

    // sessionId가 있을 때만 추가
    if (sessionId && sessionId.trim() !== '') {
      requestBody.sessionId = sessionId;
    }

    // images가 있을 때만 추가
    if (images && images.length > 0) {
      requestBody.images = images;
    }

    console.log('🚀 API 호출 시작:', {
      url: '/api/ai-generate',
      method: 'POST',
      body: requestBody,
    });

    const response = await apiClient.post<AIGenerationResult>(
      '/api/ai-generate',
      requestBody,
    );

    return response.data;
  } catch (error) {
    console.error('❌ AI 텍스트 생성 API 호출 실패:', error);
    throw error;
  }
}

// ===== Zustand 스토어 =====
interface CreateState {
  // 설정
  config: CreateConfig;

  // 입력 상태
  prompt: string;
  style: WritingStyle;
  length: LengthOption;
  emotion: EmotionOption;

  // 생성 상태
  isGenerating: boolean;
  error: string | null;

  // 생성된 결과
  generatedText: string | null;
  generatedKeywords: string[] | null;
  sessionId: string | null; // session_id 상태 추가

  // 기본 액션
  setPrompt: (prompt: string) => void;
  setStyle: (style: WritingStyle) => void;
  setLength: (length: LengthOption) => void;
  setEmotion: (emotion: EmotionOption) => void;
  clearError: () => void;

  // API 액션
  generateText: (emotion?: EmotionOption) => Promise<void>;

  // 유틸리티
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
}

export const useCreateStore = create<CreateState>()(
  persist(
    immer((set, get) => ({
      // 초기 상태
      config: DEFAULT_CONFIG,
      prompt: '',
      style: 'poem',
      length: 'short',
      emotion: '',
      isGenerating: false,
      error: null,
      generatedText: null,
      generatedKeywords: null,
      sessionId: null, // 빈 문자열이 아닌 null로 설정

      // 기본 액션들
      setPrompt: (prompt) =>
        set((state) => {
          state.prompt = prompt;
        }),
      setStyle: (style) =>
        set((state) => {
          state.style = style;
        }),
      setLength: (length) =>
        set((state) => {
          state.length = length;
        }),
      setEmotion: (emotion: EmotionOption) =>
        set((state) => {
          state.emotion = emotion;
        }),
      clearError: () =>
        set((state) => {
          state.error = null;
        }),

      // AI 텍스트 생성
      generateText: async (emotion?: EmotionOption) => {
        const { prompt, style, length } = get();
        if (!prompt.trim()) return;

        set((state) => {
          state.isGenerating = true;
          state.error = null;
        });

        try {
          // AI 텍스트 생성 API 호출 (새 생성 시 sessionId는 전달하지 않음)
          const response = await generateAIText({
            prompt: prompt.trim(),
            style,
            length,
            emotion: emotion || '',
            regeneration_count: 1,
            // sessionId는 전달하지 않음 (백엔드에서 새로 생성)
          });
          console.log('response', response);

          // 결과 저장 (새로운 sessionId로 업데이트)
          set((state) => {
            state.generatedText = response.ai_generated_text;
            state.generatedKeywords = response.keywords;
            state.sessionId = response.session_id; // 새로운 session_id 저장
            state.isGenerating = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '텍스트 생성 중 오류가 발생했습니다.';

          console.error('❌ AI 텍스트 생성 실패:', error);

          set((state) => {
            state.error = errorMessage;
            state.isGenerating = false;
          });
        }
      },

      // 유틸리티 함수들
      getStyleDisplayName: (style) => {
        const { config } = get();
        return (
          config.styles.find((s) => s.value === style)?.displayName || style
        );
      },
      getLengthDisplayName: (length) => {
        const { config } = get();
        return (
          config.lengths.find((l) => l.value === length)?.displayName || length
        );
      },
    })),
    {
      name: 'create-store',
      partialize: (state) => ({
        style: state.style,
        length: state.length,
        generatedText: state.generatedText,
        generatedKeywords: state.generatedKeywords,
      }),
    },
  ),
);
