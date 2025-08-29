'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== 타입 정의 =====
export type EmotionOption =
  | ''
  | 'happy'
  | 'sad'
  | 'angry'
  | 'peaceful'
  | 'unrest';

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

// ===== 감정 설정 데이터 =====
const EMOTION_CONFIGS: EmotionConfig[] = [
  {
    value: 'peaceful',
    label: '평온',
    emoji: '😌',
    styles: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      ring: 'ring-green-400',
    },
  },
  {
    value: 'happy',
    label: '기쁨',
    emoji: '😄',
    styles: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      ring: 'ring-yellow-400',
    },
  },
  {
    value: 'sad',
    label: '슬픔',
    emoji: '😢',
    styles: {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      ring: 'ring-sky-400',
    },
  },
  {
    value: 'angry',
    label: '분노',
    emoji: '😠',
    styles: {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      ring: 'ring-pink-400',
    },
  },
  {
    value: 'unrest',
    label: '불안',
    emoji: '🫨',
    styles: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      ring: 'ring-orange-400',
    },
  },
];

// ===== 감정 분석 유틸리티 =====
export class EmotionAnalyzer {
  static detectEmotion(text: string): EmotionOption {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('기쁨') ||
      lowerText.includes('행복') ||
      lowerText.includes('즐거')
    )
      return 'happy';
    if (
      lowerText.includes('슬픔') ||
      lowerText.includes('우울') ||
      lowerText.includes('눈물')
    )
      return 'sad';
    if (
      lowerText.includes('화') ||
      lowerText.includes('분노') ||
      lowerText.includes('짜증')
    )
      return 'angry';
    if (
      lowerText.includes('당황') ||
      lowerText.includes('걱정') ||
      lowerText.includes('불안')
    )
      return 'unrest';
    if (
      lowerText.includes('평온') ||
      lowerText.includes('고요') ||
      lowerText.includes('조용')
    )
      return 'peaceful';

    return 'peaceful'; // 기본값
  }

  static getEmotionTone(emotion: EmotionOption): string {
    const toneMap: Record<EmotionOption, string> = {
      happy: '기쁨이 배어있는',
      sad: '슬픔이 배어있는',
      angry: '분노가 배어있는',
      unrest: '불안한',
      peaceful: '평온한',
      '': '담담한',
    };
    return toneMap[emotion];
  }
}

// ===== 스토어 상태 타입 =====
interface EmotionState {
  // 감정 설정
  emotions: EmotionConfig[];
  selectedEmotion: EmotionOption;

  // 감정 히스토리 (최근 사용한 감정들)
  recentEmotions: EmotionOption[];

  // 액션들
  setSelectedEmotion: (emotion: EmotionOption) => void;
  toggleEmotion: (emotion: EmotionOption) => void;
  clearEmotion: () => void;
  addToRecent: (emotion: EmotionOption) => void;

  // 유틸리티
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
  getEmotionLabel: (emotion: EmotionOption) => string;
  getEmotionEmoji: (emotion: EmotionOption) => string;
  detectTextEmotion: (text: string) => EmotionOption;
  getEmotionTone: (emotion: EmotionOption) => string;
}

// ===== Zustand 스토어 =====
export const useEmotionStore = create<EmotionState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      emotions: EMOTION_CONFIGS,
      selectedEmotion: 'peaceful',
      recentEmotions: [],

      // 기본 액션들
      setSelectedEmotion: (emotion) => {
        set({ selectedEmotion: emotion });
        get().addToRecent(emotion);
      },

      toggleEmotion: (emotion) => {
        const { selectedEmotion } = get();
        const newEmotion = selectedEmotion === emotion ? '' : emotion;
        set({ selectedEmotion: newEmotion });
        if (newEmotion) {
          get().addToRecent(newEmotion);
        }
      },

      clearEmotion: () => {
        set({ selectedEmotion: '' });
      },

      addToRecent: (emotion) => {
        if (!emotion) return;

        set((state) => ({
          recentEmotions: [
            emotion,
            ...state.recentEmotions.filter((e) => e !== emotion),
          ].slice(0, 5), // 최근 5개만 유지
        }));
      },

      // 유틸리티 함수들
      getEmotionConfig: (emotion) => {
        const { emotions } = get();
        return emotions.find((e) => e.value === emotion);
      },

      getEmotionLabel: (emotion) => {
        const config = get().getEmotionConfig(emotion);
        return config?.label || emotion;
      },

      getEmotionEmoji: (emotion) => {
        const config = get().getEmotionConfig(emotion);
        return config?.emoji || '';
      },

      detectTextEmotion: (text) => {
        return EmotionAnalyzer.detectEmotion(text);
      },

      getEmotionTone: (emotion) => {
        return EmotionAnalyzer.getEmotionTone(emotion);
      },
    }),
    {
      name: 'emotion-store',
      partialize: (state) => ({
        selectedEmotion: state.selectedEmotion,
        recentEmotions: state.recentEmotions,
      }),
    },
  ),
);
