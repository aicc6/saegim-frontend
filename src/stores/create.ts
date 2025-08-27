'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/lib/api';

// ===== 타입 정의 =====
export type WritingStyle = '시' | '단편글';
export type LengthOption = '단문' | '중문' | '장문';
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
    { value: '시', label: '시', displayName: 'poem' },
    { value: '단편글', label: '단편글', displayName: 'prose' },
  ],
  lengths: [
    { value: '단문', label: '단문', displayName: 'short' },
    { value: '중문', label: '중문', displayName: 'medium' },
    { value: '장문', label: '장문', displayName: 'long' },
  ],
};

// ===== API 함수들 =====
export async function generateAIText(
  prompt: string,
  style: string,
  length: string,
  emotion: string = '',
  regeneration_count: number = 0,
  sessionId?: string,
  images?: File[],
): Promise<AIGenerationResult> {
  try {
    console.log('🚀 API 호출 시작:', {
      url: '/api/ai-generate',
      method: 'POST',
      body: {
        prompt,
        style,
        length,
        emotion,
        regeneration_count,
        sessionId,
        images,
      },
    });

    const response = await apiClient.post<AIGenerationResult>(
      '/api/ai-generate',
      {
        prompt,
        style,
        length,
        emotion,
        regeneration_count,
        sessionId,
        images,
      },
    );

    // ApiResponse<AIGenerationResult>에서 data 추출
    return response.data;
  } catch (error) {
    console.error('💥 API 호출 중 오류 발생:', error);

    if (error instanceof APIError) {
      throw error;
    }

    // 네트워크 오류인지 확인
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(
        '네트워크 연결을 확인해주세요. 백엔드 서버가 실행 중인지 확인하세요.',
      );
    }

    throw new APIError('AI 텍스트 생성 중 오류가 발생했습니다.');
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
      style: '시',
      length: '단문',
      emotion: '',
      isGenerating: false,
      error: null,
      generatedText: null,
      generatedKeywords: null,
      sessionId: '',

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
          // AI 텍스트 생성 API 호출
          const response = await generateAIText(
            prompt.trim(),
            style,
            length,
            emotion || '',
            1,
          );
          console.log('response', response);

          // 결과 저장
          set((state) => {
            state.generatedText = response.ai_generated_text;
            state.generatedKeywords = response.keywords;
            state.sessionId = response.session_id; // session_id 저장
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
