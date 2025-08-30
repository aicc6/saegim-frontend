'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AIService } from '@/services/ai-service';
import { getLogger } from '../lib/logger';

const logger = getLogger('create');

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

// ===== Zustand 스토어 =====
interface CreateState {
  // 설정
  config: CreateConfig;

  // 입력 상태
  prompt: string;
  originalPrompt: string;
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
  wasJustGenerated: boolean; // 방금 생성되었는지 추적

  // 기본 액션
  setPrompt: (prompt: string) => void;
  setStyle: (style: WritingStyle) => void;
  setLength: (length: LengthOption) => void;
  setEmotion: (emotion: EmotionOption) => void;
  clearError: () => void;
  clearGeneratedText: () => void;

  // API 액션
  generateText: (emotion?: EmotionOption) => Promise<void>;

  // 유틸리티
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
  markAsProcessed: () => void; // 처리 완료 마킹
  restoreOriginalInput: () => Promise<void>; // 원본 입력 복구
  resetToDefaults: () => void; // 기본값으로 초기화
}

export const useCreateStore = create<CreateState>()(
  persist(
    immer((set, get) => ({
      // 초기 상태
      config: DEFAULT_CONFIG,
      prompt: '',
      originalPrompt: '',
      style: 'poem',
      length: 'short',
      emotion: '',
      isGenerating: false,
      error: null,
      generatedText: null,
      generatedKeywords: null,
      sessionId: null, // 빈 문자열이 아닌 null로 설정
      wasJustGenerated: false,

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
      clearGeneratedText: () =>
        set((state) => {
          state.generatedText = null;
          state.generatedKeywords = null;
          state.sessionId = null;
        }),

      // AI 텍스트 생성 (서비스 레이어 사용)
      generateText: async (emotion?: EmotionOption) => {
        const { prompt, style, length } = get();
        if (!prompt.trim()) return;

        set((state) => {
          state.isGenerating = true;
          state.error = null;
        });

        try {
          const response = await AIService.generateText({
            prompt: prompt.trim(),
            style,
            length,
            emotion: emotion || '',
            regeneration_count: 1,
          });

          set((state) => {
            state.generatedText = response.ai_generated_text;
            state.generatedKeywords = response.keywords;
            state.sessionId = response.session_id;
            state.originalPrompt = state.prompt;
            state.isGenerating = false;
            state.wasJustGenerated = true;
          });

          logger.info('AI 텍스트 생성 성공', {
            sessionId: response.session_id,
            textLength: response.ai_generated_text.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '텍스트 생성 중 오류가 발생했습니다.';

          logger.error('AI 텍스트 생성 실패', { error });

          set((state) => {
            state.error = errorMessage;
            state.isGenerating = false;
          });
        }
      },

      // 유틸리티 함수들
      getStyleDisplayName: (style) => {
        const { config } = get();
        return config.styles.find((s) => s.value === style)?.label || style;
      },
      getLengthDisplayName: (length) => {
        const { config } = get();
        return config.lengths.find((l) => l.value === length)?.label || length;
      },
      markAsProcessed: () =>
        set((state) => {
          state.wasJustGenerated = false;
        }),

      // 세션ID로 원본 입력 복구 (서비스 레이어 사용)
      restoreOriginalInput: async () => {
        const { sessionId } = get();
        if (!sessionId) return;

        try {
          const originalInput = await AIService.getOriginalUserInput(sessionId);
          if (originalInput) {
            set((state) => {
              state.originalPrompt = originalInput;
            });
          }
        } catch (error) {
          logger.error('원본 입력 복구 실패', { error });
        }
      },
      resetToDefaults: () =>
        set((state) => {
          state.prompt = '';
          state.style = 'poem';
          state.length = 'short';
          state.emotion = '';
          state.error = null;
          state.generatedText = null;
          state.generatedKeywords = null;
          state.sessionId = null;
          state.wasJustGenerated = false;
        }),
    })),
    {
      name: 'create-store',
      partialize: (state) => ({
        generatedText: state.generatedText,
        generatedKeywords: state.generatedKeywords,
      }),
    },
  ),
);
