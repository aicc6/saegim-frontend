import { useMemo } from 'react';
import { CalendarDay, EmotionCount } from '@/types/calendar';
import { DiaryListEntry, EmotionType } from '@/types/diary';
import { DateUtils } from '@/lib/date-utils';

export const useCalendarDays = (
  year: number,
  month: number,
  diaries: DiaryListEntry[],
  selectedDate: string | null,
  effectiveDate: Date,
  deletedImageIds: Set<string>,
): CalendarDay[] => {
  return useMemo(() => {
    const { startDate, endDate } = DateUtils.getCalendarBounds(year, month);
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    const todayStr = DateUtils.getTodayString();

    while (current <= endDate) {
      const dateStr = DateUtils.formatDateString(current);
      const dayEntries = diaries.filter((entry) =>
        entry.created_at.startsWith(dateStr),
      );

      // Calculate dominant emotion
      let dominantEmotion: EmotionType | null = null;
      let topKeywords: string[] = [];
      let thumbnailPath: string | null = null;
      const allImages: string[] = [];

      if (dayEntries.length > 0) {
        dominantEmotion = calculateDominantEmotion(dayEntries);
        topKeywords = extractTopKeywords(dayEntries);
        const { thumbnail, images } = extractImages(
          dayEntries,
          deletedImageIds,
        );
        thumbnailPath = thumbnail;
        allImages.push(...images);
      }

      days.push({
        date: new Date(current),
        dateStr,
        entries: dayEntries,
        dominantEmotion,
        keywords: topKeywords,
        isCurrentMonth: current.getMonth() === effectiveDate.getMonth(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        thumbnailPath,
        allImages,
        currentImageIndex: 0,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [year, month, diaries, selectedDate, effectiveDate, deletedImageIds]);
};

function calculateDominantEmotion(
  entries: DiaryListEntry[],
): EmotionType | null {
  const emotionCounts: EmotionCount = {
    happy: 0,
    sad: 0,
    angry: 0,
    peaceful: 0,
    unrest: 0,
  };

  entries.forEach((entry) => {
    if (entry.user_emotion && entry.user_emotion in emotionCounts) {
      emotionCounts[entry.user_emotion as EmotionType]++;
    }
  });

  const topEmotion = Object.entries(emotionCounts)
    .filter(([_, count]) => count > 0)
    .sort(([_, countA], [__, countB]) => countB - countA)[0];

  return topEmotion ? (topEmotion[0] as EmotionType) : null;
}

function extractTopKeywords(entries: DiaryListEntry[]): string[] {
  const firstEntry = entries[0];
  return firstEntry.keywords && Array.isArray(firstEntry.keywords)
    ? firstEntry.keywords.slice(0, 2)
    : [];
}

function extractImages(
  entries: DiaryListEntry[],
  deletedImageIds: Set<string>,
): { thumbnail: string | null; images: string[] } {
  let thumbnail: string | null = null;
  const images: string[] = [];

  entries.forEach((entry) => {
    if (entry.images && entry.images.length > 0) {
      const validImages = entry.images.filter(
        (img) => img.thumbnail_path && !deletedImageIds.has(img.id),
      );

      validImages.forEach((img) => {
        if (img.thumbnail_path) {
          images.push(img.thumbnail_path);
          if (!thumbnail) {
            thumbnail = img.thumbnail_path;
          }
        }
      });
    }
  });

  return { thumbnail, images };
}
