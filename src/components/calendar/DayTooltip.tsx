import { DiaryListEntry, EMOTION_EMOJIS, EmotionType } from '@/types/diary';

interface DayTooltipProps {
  entries: DiaryListEntry[];
  dominantEmotion: EmotionType | null;
  imageCount: number;
}

export const DayTooltip = ({
  entries,
  dominantEmotion,
  imageCount,
}: DayTooltipProps) => {
  if (entries.length === 0) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none">
      <div className="bg-gray-900 text-white text-caption px-2 py-1 rounded whitespace-nowrap">
        {entries.length}개 기록
        {dominantEmotion && (
          <span className="ml-1">({EMOTION_EMOJIS[dominantEmotion]})</span>
        )}
        {imageCount > 0 && <span className="ml-1">📷 {imageCount}장</span>}
      </div>
    </div>
  );
};
