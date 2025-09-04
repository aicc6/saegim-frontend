import { CalendarDay as CalendarDayType } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { ThumbnailImage } from './ThumbnailImage';
import { EmotionIndicator } from './EmotionIndicator';
import { DayTooltip } from './DayTooltip';

interface CalendarDayProps {
  day: CalendarDayType;
  index: number;
  totalDays: number;
  currentImageIndex: number;
  onDateClick: (dateStr: string) => void;
  onImageRotate: (dateStr: string, allImages: string[]) => void;
}

export const CalendarDay = ({
  day,
  index,
  totalDays,
  currentImageIndex,
  onDateClick,
  onImageRotate,
}: CalendarDayProps) => {
  // 디버깅용 로그
  if (day.isToday) {
    console.log('오늘 날짜 감지:', {
      dateStr: day.dateStr,
      isToday: day.isToday,
      isSelected: day.isSelected,
      isCurrentMonth: day.isCurrentMonth,
      date: day.date,
    });
  }

  const handleClick = () => {
    onDateClick(day.dateStr);
  };

  const getDayStyles = () => {
    const baseStyles = {
      borderColor:
        day.isCurrentMonth && !day.isSelected ? '#C9D6CB' : undefined,
      borderWidth: day.isCurrentMonth && !day.isSelected ? '1px' : undefined,
      backgroundColor:
        day.isCurrentMonth && !day.isSelected
          ? 'rgba(247, 249, 248, 0.5)'
          : undefined,
      ...(day.isSelected
        ? {
            border: '2px solid #B2C5B8',
            backgroundColor: '#F9F5EF',
          }
        : {}),
      // 오늘 날짜는 CSS 클래스로만 처리 (다크모드 지원)
    };

    return baseStyles;
  };

  const getDayClasses = () => {
    return cn(
      'aspect-square p-2 relative transition-colors overflow-hidden',
      // Border management
      !day.isSelected && 'border border-gray-200',
      index % 7 === 6 && !day.isSelected && 'border-r-0',
      index < 7 && !day.isSelected && 'border-t-0',
      index >= totalDays - 7 && !day.isSelected && 'border-b-0',
      // Visual states
      !day.isCurrentMonth && 'opacity-50',
      // 오늘 날짜 스타일 (우선순위 높게)
      day.isToday &&
        'bg-sage-30 dark:bg-sage-100 border-2 border-sage-100 dark:border-sage-200 shadow-md calendar-day-today',
      !day.isSelected && 'hover:bg-gray-50',
    );
  };

  const getDateNumberStyles = () => {
    return {
      fontWeight: day.isCurrentMonth ? 'bold' : 'normal',
      ...(day.isSelected ? { color: '#000000' } : {}),
    };
  };

  return (
    <button
      onClick={handleClick}
      data-date={day.dateStr}
      className={getDayClasses()}
      style={getDayStyles()}
    >
      {/* Date number */}
      <div
        className={cn(
          'absolute top-1 right-1 text-body-small z-10',
          day.isCurrentMonth ? 'font-bold' : 'font-medium',
          day.isToday
            ? 'text-sage-700 dark:text-sage-300 font-black text-lg calendar-date-number'
            : 'text-text-primary',
        )}
        style={getDateNumberStyles()}
      >
        {day.date.getDate()}
      </div>

      {/* Thumbnail image */}
      <ThumbnailImage
        allImages={day.allImages}
        currentImageIndex={currentImageIndex}
        dateStr={day.dateStr}
        onImageRotate={onImageRotate}
      />

      {/* Emotion and keywords indicator */}
      <EmotionIndicator
        emotion={day.dominantEmotion}
        keywords={day.keywords}
        isCurrentMonth={day.isCurrentMonth}
        isSelected={day.isSelected}
      />

      {/* Tooltip */}
      <DayTooltip
        entries={day.entries}
        dominantEmotion={day.dominantEmotion}
        imageCount={day.allImages.length}
      />
    </button>
  );
};
