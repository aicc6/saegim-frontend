import { WritingStyle, LengthOption } from '@/stores/create';
import { EmotionOption, EmotionConfig } from '@/stores/emotion';
import { useDarkMode } from '@/hooks/use-dark-mode';

interface ChatOptionsProps {
  config: {
    styles: Array<{ value: WritingStyle; label: string }>;
    lengths: Array<{ value: LengthOption; label: string }>;
  };
  emotionConfigs: EmotionConfig[];
  tempStyle: WritingStyle;
  tempLength: LengthOption;
  tempEmotion: EmotionOption;
  onStyleChange: (style: WritingStyle) => void;
  onLengthChange: (length: LengthOption) => void;
  onEmotionChange: (emotion: EmotionOption) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatOptions = ({
  config,
  emotionConfigs,
  tempStyle,
  tempLength,
  tempEmotion,
  onStyleChange,
  onLengthChange,
  onEmotionChange,
  onKeyDown,
}: ChatOptionsProps) => {
  const isDarkMode = useDarkMode();
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex gap-2">
        <select
          value={tempStyle}
          onChange={(e) => onStyleChange(e.target.value as WritingStyle)}
          onKeyDown={onKeyDown}
          className={`saegim-select-darkable rounded-lg border ${
            isDarkMode
              ? 'border-gray-600 bg-black text-white'
              : 'border-gray-200 bg-white text-gray-900'
          } px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500`}
        >
          {config.styles.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className={
                isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
              }
            >
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={tempLength}
          onChange={(e) => onLengthChange(e.target.value as LengthOption)}
          onKeyDown={onKeyDown}
          className={`saegim-select-darkable rounded-lg border ${
            isDarkMode
              ? 'border-gray-600 bg-black text-white'
              : 'border-gray-200 bg-white text-gray-900'
          } px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500`}
        >
          {config.lengths.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className={
                isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
              }
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 감정 이모지 */}
      <div className="flex gap-1 ml-auto">
        {emotionConfigs.map(({ value, emoji, styles }) => (
          <button
            key={value}
            type="button"
            onClick={() => onEmotionChange(tempEmotion === value ? '' : value)}
            onKeyDown={onKeyDown}
            className={`h-8 w-8 rounded-full text-sm transition-all ${
              tempEmotion === value
                ? `${styles.bg} ring-2 ${styles.ring} scale-110`
                : 'hover:bg-gray-50'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
