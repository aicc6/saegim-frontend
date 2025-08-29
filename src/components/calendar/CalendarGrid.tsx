import { CalendarDay as CalendarDayType } from '@/types/calendar';
import { CalendarDay } from './CalendarDay';

interface CalendarGridProps {
  days: CalendarDayType[];
  imageIndices: Record<string, number>;
  onDateClick: (dateStr: string) => void;
  onImageRotate: (dateStr: string, allImages: string[]) => void;
}

export const CalendarGrid = ({
  days,
  imageIndices,
  onDateClick,
  onImageRotate,
}: CalendarGridProps) => (
  <div className="grid grid-cols-7">
    {days.map((day, index) => (
      <CalendarDay
        key={`${day.dateStr}-${index}`}
        day={day}
        index={index}
        totalDays={days.length}
        currentImageIndex={imageIndices[day.dateStr] || 0}
        onDateClick={onDateClick}
        onImageRotate={onImageRotate}
      />
    ))}
  </div>
);
