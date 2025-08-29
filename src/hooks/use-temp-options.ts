import { useState, useEffect, useCallback } from 'react';
import { WritingStyle, LengthOption } from '@/stores/create';
import { EmotionOption } from '@/stores/emotion';

interface UseTempOptionsProps {
  initialStyle: WritingStyle;
  initialLength: LengthOption;
  initialEmotion: EmotionOption;
  onApply: (
    style: WritingStyle,
    length: LengthOption,
    emotion: EmotionOption,
  ) => void;
}

export const useTempOptions = ({
  initialStyle,
  initialLength,
  initialEmotion,
  onApply,
}: UseTempOptionsProps) => {
  const [tempStyle, setTempStyle] = useState<WritingStyle>(initialStyle);
  const [tempLength, setTempLength] = useState<LengthOption>(initialLength);
  const [tempEmotion, setTempEmotion] = useState<EmotionOption>(initialEmotion);

  const applyOptions = useCallback((): void => {
    onApply(tempStyle, tempLength, tempEmotion);
  }, [tempStyle, tempLength, tempEmotion, onApply]);

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyOptions();
      }
    },
    [applyOptions],
  );

  useEffect(() => {
    setTempStyle(initialStyle);
    setTempLength(initialLength);
    setTempEmotion(initialEmotion);
  }, [initialStyle, initialLength, initialEmotion]);

  return {
    tempStyle,
    tempLength,
    tempEmotion,
    setTempStyle,
    setTempLength,
    setTempEmotion,
    applyOptions,
    handleOptionKeyDown,
  };
};
