import { EmotionOption, EmotionConfig } from '@/stores/emotion';

interface EmotionGuideProps {
  emotion: EmotionOption;
  emotionConfigs: EmotionConfig[];
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
}

export const EmotionGuide = ({
  emotion,
  emotionConfigs,
  getEmotionConfig,
}: EmotionGuideProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-medium">
        AI가 추측한 감정은{' '}
        {emotion
          ? emotionConfigs.find((e) => e.value === emotion)?.label || emotion
          : '감정 선택 안함'}
        {emotion && getEmotionConfig(emotion)?.emoji} 입니다.
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      다른 감정을 원하시면 아래에 선택해 주세요
    </p>
  </div>
);
