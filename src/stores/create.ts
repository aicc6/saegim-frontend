'use client';

import { create } from 'zustand';

// 타입 정의
export type WritingStyle = '시' | '단편글';
export type LengthOption = '단문' | '중문' | '장문';
export type EmotionOption = '' | '슬픔' | '기쁨' | '분노' | '당황' | '평온';

// 결과 카드 데이터 구조
export interface GeneratedResult {
  id: number;
  content: string;
  style: WritingStyle;
  length: LengthOption;
  emotion: EmotionOption;
  prompt: string;
  createdAt: Date;
  isRegenerating?: boolean;
  history: string[];
  currentHistoryIndex: number;
  regenerateCount: number;
}

// 옵션 구조
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

export interface EmotionConfig {
  value: EmotionOption;
  label: string;
  emoji: string;
  styles: {
    bg: string;
    text: string;
    ring: string;
  };
}

// 설정 데이터
export interface CreateConfig {
  styles: StyleOption[];
  lengths: LengthConfig[];
  emotions: EmotionConfig[];
  maxRegenerateCount: number;
  loadingDelay: number;
}

// 스토어 상태 타입
interface CreateState {
  // 설정 데이터
  config: CreateConfig;

  // 현재 입력 상태
  prompt: string;
  style: WritingStyle;
  length: LengthOption;
  emotion: EmotionOption;

  // 생성 상태
  isGenerating: boolean;
  generatedResults: GeneratedResult[];

  // 액션
  setPrompt: (prompt: string) => void;
  setStyle: (style: WritingStyle) => void;
  setLength: (length: LengthOption) => void;
  setEmotion: (emotion: EmotionOption) => void;

  // API 관련 액션
  generateText: () => Promise<void>;
  regenerateText: (result: GeneratedResult) => Promise<void>;
  navigateHistory: (
    result: GeneratedResult,
    direction: 'prev' | 'next',
  ) => void;
  saveToDiary: (resultId: number) => Promise<void>;

  // 유틸리티 함수
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
}

// 임시 텍스트 생성 함수 (백엔드 API로 대체 예정)
const generateTextContent = (
  prompt: string,
  style: WritingStyle,
  length: LengthOption,
  emotion: EmotionOption,
): string => {
  const trimmed = prompt.trim();
  if (!trimmed) return '';

  const emotionTone = emotion ? `${emotion}이 배어있는` : '담담한';

  if (style === '시') {
    const linesCount = length === '단문' ? 3 : length === '중문' ? 5 : 7;
    const lines: string[] = [];
    for (let i = 0; i < linesCount; i++) {
      if (i === 0) lines.push(`${trimmed} 위로`);
      else if (i === 1) lines.push(`${emotionTone} 마음이 스며들고`);
      else if (i === linesCount - 1) lines.push(`오늘의 나를 조심스레 새긴다`);
      else lines.push(`사이사이 숨을 고르며, ${trimmed}을(를) 떠올린다`);
    }
    return lines.join('\n');
  }

  const sentencesCount = length === '단문' ? 2 : length === '중문' ? 3 : 4;
  const sentences: string[] = [];
  for (let i = 0; i < sentencesCount; i++) {
    if (i === 0)
      sentences.push(
        `${trimmed}에 대해 생각해 본다. ${emotionTone} 감정이 가볍게 배어 나온다.`,
      );
    else if (i === sentencesCount - 1)
      sentences.push(
        `나는 오늘의 감정을 조용히 기록한다. 그리고 그 안에서 작은 나를 다시 발견한다.`,
      );
    else
      sentences.push(
        `사소한 기척들 속에서 ${trimmed}은(는) 형태를 바꾸고, 나도 조금은 달라진다.`,
      );
  }
  return sentences.join(' ');
};

// 기본 설정 데이터 (나중에 API에서 가져올 데이터)
const defaultConfig: CreateConfig = {
  styles: [
    { value: '시', label: '시', displayName: 'poem' },
    { value: '단편글', label: '단편글', displayName: 'prose' },
  ],
  lengths: [
    { value: '단문', label: '단문', displayName: 'short' },
    { value: '중문', label: '중문', displayName: 'medium' },
    { value: '장문', label: '장문', displayName: 'long' },
  ],
  emotions: [
    {
      value: '기쁨',
      label: '기쁨',
      emoji: '😄',
      styles: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        ring: 'ring-yellow-300',
      },
    },
    {
      value: '슬픔',
      label: '슬픔',
      emoji: '😢',
      styles: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        ring: 'ring-blue-300',
      },
    },
    {
      value: '분노',
      label: '분노',
      emoji: '😠',
      styles: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-300' },
    },
    {
      value: '당황',
      label: '당황',
      emoji: '😰',
      styles: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        ring: 'ring-orange-300',
      },
    },
    {
      value: '평온',
      label: '평온',
      emoji: '😌',
      styles: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        ring: 'ring-green-300',
      },
    },
  ],
  maxRegenerateCount: 5,
  loadingDelay: 450,
};

// Zustand 스토어 생성
export const useCreateStore = create<CreateState>((set, get) => ({
  // 초기 상태
  config: defaultConfig,
  prompt: '',
  style: '시',
  length: '단문',
  emotion: '평온',
  isGenerating: false,
  generatedResults: [],

  // 기본 setter 액션들
  setPrompt: (prompt) => set({ prompt }),
  setStyle: (style) => set({ style }),
  setLength: (length) => set({ length }),
  setEmotion: (emotion) => set({ emotion }),

  // 텍스트 생성 액션
  generateText: async () => {
    const { prompt, style, length, emotion, config } = get();
    if (!prompt.trim()) return;

    set({ isGenerating: true });

    try {
      // TODO: 실제 API 호출로 대체
      await new Promise((resolve) => setTimeout(resolve, config.loadingDelay));

      const content = generateTextContent(prompt, style, length, emotion);
      const newResult: GeneratedResult = {
        id: Date.now(),
        content,
        style,
        length,
        emotion,
        prompt,
        createdAt: new Date(),
        history: [content],
        currentHistoryIndex: 0,
        regenerateCount: 0,
      };

      set((state) => ({
        generatedResults: [...state.generatedResults, newResult],
        prompt: '', // 성공적으로 생성 후 입력창 초기화
      }));
    } catch (error) {
      console.error('텍스트 생성 실패:', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  // 재생성 액션
  regenerateText: async (result) => {
    const { config } = get();

    if (result.regenerateCount >= config.maxRegenerateCount) {
      alert(`재생성은 최대 ${config.maxRegenerateCount}번까지만 가능합니다.`);
      return;
    }

    try {
      set((state) => ({
        generatedResults: state.generatedResults.map((item) =>
          item.id === result.id ? { ...item, isRegenerating: true } : item,
        ),
      }));

      await new Promise((resolve) => setTimeout(resolve, config.loadingDelay));

      const newContent = generateTextContent(
        result.prompt,
        result.style,
        result.length,
        result.emotion,
      );

      set((state) => ({
        generatedResults: state.generatedResults.map((item) =>
          item.id === result.id
            ? {
                ...item,
                content: newContent,
                createdAt: new Date(),
                isRegenerating: false,
                history: [...item.history, newContent],
                currentHistoryIndex: item.history.length,
                regenerateCount: item.regenerateCount + 1,
              }
            : item,
        ),
      }));
    } catch (error) {
      console.error('텍스트 재생성 실패:', error);
      set((state) => ({
        generatedResults: state.generatedResults.map((item) =>
          item.id === result.id ? { ...item, isRegenerating: false } : item,
        ),
      }));
    }
  },

  // 히스토리 네비게이션
  navigateHistory: (result, direction) => {
    const newIndex =
      direction === 'prev'
        ? result.currentHistoryIndex - 1
        : result.currentHistoryIndex + 1;

    if (newIndex < 0 || newIndex >= result.history.length) return;

    set((state) => ({
      generatedResults: state.generatedResults.map((item) =>
        item.id === result.id
          ? {
              ...item,
              content: item.history[newIndex],
              currentHistoryIndex: newIndex,
            }
          : item,
      ),
    }));
  },

  // 다이어리에 저장
  saveToDiary: async (resultId) => {
    // TODO: API 호출
    console.log('다이어리에 저장:', resultId);
  },

  // 유틸리티 함수들
  getStyleDisplayName: (style) => {
    const { config } = get();
    return config.styles.find((s) => s.value === style)?.displayName || style;
  },

  getLengthDisplayName: (length) => {
    const { config } = get();
    return (
      config.lengths.find((l) => l.value === length)?.displayName || length
    );
  },

  getEmotionConfig: (emotion) => {
    const { config } = get();
    return config.emotions.find((e) => e.value === emotion);
  },
}));
