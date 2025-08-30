'use client';

import { create } from 'zustand';
import { createStandardStore } from '@/lib/store-helpers';
import { EmotionService } from '@/services/emotion-service';

// 타입 정의
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

// 감정 설정 데이터
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

// 스토어 상태 인터페이스
interface EmotionState {
  emotions: EmotionConfig[];
  selectedEmotion: EmotionOption;
  recentEmotions: EmotionOption[];
}

// 스토어 액션 인터페이스
interface EmotionActions {
  setSelectedEmotion: (emotion: EmotionOption) => void;
  toggleEmotion: (emotion: EmotionOption) => void;
  clearEmotion: () => void;
  addToRecent: (emotion: EmotionOption) => void;
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
  getEmotionLabel: (emotion: EmotionOption) => string;
  getEmotionEmoji: (emotion: EmotionOption) => string;
  detectTextEmotion: (text: string) => EmotionOption;
  getEmotionTone: (emotion: EmotionOption) => string;
}

// 초기 상태
const createInitialState = (): EmotionState => ({
  emotions: EMOTION_CONFIGS,
  selectedEmotion: 'peaceful',
  recentEmotions: [],
});

// 스토어 생성
export const useEmotionStore = create<EmotionState & EmotionActions>()(
  createStandardStore(
    (set, get) => ({
      // 초기 상태
      ...createInitialState(),

      // 기본 액션들
      setSelectedEmotion: (emotion) => {
        set((state) => ({ ...state, selectedEmotion: emotion }));
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
          ...state,
          recentEmotions: [
            emotion,
            ...state.recentEmotions.filter((e) => e !== emotion),
          ].slice(0, 5), // 최근 5개만 유지
        }));
      },

      // 유틸리티 함수들 (서비스 레이어 사용)
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
        return EmotionService.detectEmotion(text);
      },

      getEmotionTone: (emotion) => {
        return EmotionService.getEmotionTone(emotion);
      },
    }),
    {
      persist: {
        name: 'emotion-store',
        partialize: (state) => ({
          selectedEmotion: state.selectedEmotion,
          recentEmotions: state.recentEmotions,
        }),
      },
      enableImmer: true,
    },
  ),
);
