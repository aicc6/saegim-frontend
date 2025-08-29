import { DiaryListEntry, EmotionType } from './diary';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  entries: DiaryListEntry[];
  dominantEmotion: EmotionType | null;
  keywords: string[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  thumbnailPath: string | null;
  allImages: string[];
  currentImageIndex: number;
}

export interface CalendarProps {
  className?: string;
  onDateSelect?: (date: string) => void;
  onDateChange?: (date: Date) => void;
  currentViewDate?: Date;
}

export interface CalendarRef {
  goToToday: () => void;
}

export interface CalendarApiResponse {
  data: DiaryListEntry[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface EmotionCount {
  [key: string]: number;
}

export interface ImageIndices {
  [dateStr: string]: number;
}
