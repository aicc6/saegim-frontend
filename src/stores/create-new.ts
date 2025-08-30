'use client';

import { create } from 'zustand';
import {
  createStandardStore,
  createInitialErrorState,
  ErrorState,
  ErrorActions,
  handleApiError,
} from '@/lib/store-helpers';
import { AIService, AIGenerationRequest } from '@/services/ai-service';
import { getLogger } from '@/lib/logger';

const logger = getLogger('create-store');

// 타입 정의
export type WritingStyle = 'poem' | 'short_story';
export type LengthOption = 'short' | 'medium' | 'long';
export type EmotionOption = string;

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

// 기본 설정
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

// 스토어 상태 인터페이스
interface CreateState extends ErrorState {
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

  // 생성된 결과
  generatedText: string | null;
  generatedKeywords: string[] | null;
  sessionId: string | null;
  wasJustGenerated: boolean;
}

// 스토어 액션 인터페이스
interface CreateActions extends ErrorActions {
  // 입력 액션
  setPrompt: (prompt: string) => void;
  setStyle: (style: WritingStyle) => void;
  setLength: (length: LengthOption) => void;
  setEmotion: (emotion: EmotionOption) => void;

  // 결과 관리
  clearGeneratedText: () => void;
  markAsProcessed: () => void;
  resetToDefaults: () => void;

  // API 액션
  generateText: (emotion?: EmotionOption) => Promise<void>;
  restoreOriginalInput: () => Promise<void>;

  // 유틸리티
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
}

// 초기 상태
const createInitialState = (): CreateState => ({
  ...createInitialErrorState(),
  config: DEFAULT_CONFIG,
  prompt: '',
  originalPrompt: '',
  style: 'poem',
  length: 'short',
  emotion: '',
  isGenerating: false,
  generatedText: null,
  generatedKeywords: null,
  sessionId: null,
  wasJustGenerated: false,
});

// 스토어 생성
export const useCreateStore = create<CreateState & CreateActions>()(
  createStandardStore(
    (set, get) => ({
      // 초기 상태
      ...createInitialState(),

      // 에러 처리 액션들 (표준화)
      clearError: () => set((state) => ({ ...state, error: null })),
      setLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
      setError: (error) =>
        set((state) => ({ ...state, error, isLoading: false })),

      // 입력 액션들
      setPrompt: (prompt) =>
        set((state) => ({
          ...state,
          prompt,
        })),

      setStyle: (style) =>
        set((state) => ({
          ...state,
          style,
        })),

      setLength: (length) =>
        set((state) => ({
          ...state,
          length,
        })),

      setEmotion: (emotion) =>
        set((state) => ({
          ...state,
          emotion,
        })),

      // 결과 관리
      clearGeneratedText: () =>
        set((state) => ({
          ...state,
          generatedText: null,
          generatedKeywords: null,
          sessionId: null,
        })),

      markAsProcessed: () =>
        set((state) => ({
          ...state,
          wasJustGenerated: false,
        })),

      resetToDefaults: () =>
        set((state) => ({
          ...state,
          prompt: '',
          style: 'poem',
          length: 'short',
          emotion: '',
          error: null,
          generatedText: null,
          generatedKeywords: null,
          sessionId: null,
          wasJustGenerated: false,
        })),

      // AI 텍스트 생성 (서비스 레이어 사용)
      generateText: async (emotion?: EmotionOption) => {
        const { prompt, style, length, setLoading, setError } = get();

        if (!prompt.trim()) return;

        setLoading(true);

        try {
          const request: AIGenerationRequest = {
            prompt: prompt.trim(),
            style,
            length,
            emotion: emotion || '',
            regeneration_count: 1,
          };

          const response = await AIService.generateText(request);

          set((state) => ({
            ...state,
            generatedText: response.ai_generated_text,
            generatedKeywords: response.keywords,
            sessionId: response.session_id,
            originalPrompt: state.prompt,
            isLoading: false,
            wasJustGenerated: true,
            error: null,
          }));

          logger.info('AI 텍스트 생성 성공', {
            sessionId: response.session_id,
            textLength: response.ai_generated_text.length,
          });
        } catch (error) {
          const errorMessage = handleApiError(error, 'AI 텍스트 생성');
          setError(errorMessage);
          logger.error('AI 텍스트 생성 실패', { error });
        }
      },

      // 원본 입력 복구 (서비스 레이어 사용)
      restoreOriginalInput: async () => {
        const { sessionId, setLoading, setError } = get();

        if (!sessionId) return;

        setLoading(true);

        try {
          const originalInput = await AIService.getOriginalUserInput(sessionId);

          if (originalInput) {
            set((state) => ({
              ...state,
              originalPrompt: originalInput,
              isLoading: false,
            }));
          } else {
            setError('원본 입력을 찾을 수 없습니다.');
          }
        } catch (error) {
          const errorMessage = handleApiError(error, '원본 입력 복구');
          setError(errorMessage);
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
    }),
    {
      persist: {
        name: 'create-store',
        partialize: (state) => ({
          generatedText: state.generatedText,
          generatedKeywords: state.generatedKeywords,
        }),
      },
      enableImmer: true,
    },
  ),
);
