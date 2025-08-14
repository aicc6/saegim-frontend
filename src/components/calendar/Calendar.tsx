'use client';

import { useMemo, useState } from 'react';
import { useDiaryStore } from '@/stores/diary';
import { EmotionType, DiaryEntry } from '@/types';
import { cn, getEmotionColor, getEmotionEmoji } from '@/lib/utils';

interface CalendarDay {
  date: Date;
  dateStr: string;
  entries: DiaryEntry[];
  dominantEmotion: EmotionType | null;
  keywords: string[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface CalendarProps {
  className?: string;
  onDateSelect?: (date: string) => void;
  onDateChange?: (date: Date) => void;
}

export function Calendar({
  className,
  onDateSelect,
  onDateChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { entries } = useDiaryStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 달력 시작일 (이전 월의 일부 포함)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // 달력 종료일 (다음 월의 일부 포함)
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  // 달력에 표시할 날짜들
  const calendarDays = useMemo(() => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // 시작 주의 첫 번째 날 (일요일)
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());

    // 마지막 주의 마지막 날 (토요일)
    const endOfWeek = new Date(endDate);
    endOfWeek.setDate(endDate.getDate() + (6 - endOfWeek.getDay()));

    const days: CalendarDay[] = [];
    const current = new Date(startOfWeek);

    while (current <= endOfWeek) {
      // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
      const currentYear = current.getFullYear();
      const currentMonth = String(current.getMonth() + 1).padStart(2, '0');
      const currentDay = String(current.getDate()).padStart(2, '0');
      const dateStr = `${currentYear}-${currentMonth}-${currentDay}`;

      const dayEntries = entries.filter((entry) =>
        entry.createdAt.startsWith(dateStr),
      );

      // 해당 날짜의 우세한 기록 선택 (최신 기록 우선)
      let dominantEntry: DiaryEntry | null = null;
      let dominantEmotion: EmotionType | null = null;
      let topKeywords: string[] = [];

      if (dayEntries.length > 0) {
        // 감정별 빈도와 최신 시간 계산
        const emotionCounts: Record<EmotionType, number> = {
          happy: 0,
          sad: 0,
          angry: 0,
          peaceful: 0,
          unrest: 0,
        };

        const emotionLatestTime: Record<EmotionType, string> = {
          happy: '',
          sad: '',
          angry: '',
          peaceful: '',
          unrest: '',
        };

        const emotionLatestEntry: Record<EmotionType, DiaryEntry | null> = {
          happy: null,
          sad: null,
          angry: null,
          peaceful: null,
          unrest: null,
        };

        dayEntries.forEach((entry) => {
          if (entry.userEmotion) {
            emotionCounts[entry.userEmotion]++;
            // 더 최신 기록이면 업데이트
            if (entry.updatedAt > emotionLatestTime[entry.userEmotion]) {
              emotionLatestTime[entry.userEmotion] = entry.updatedAt;
              emotionLatestEntry[entry.userEmotion] = entry;
            }
          }
        });

        // 우세한 감정 선택 (빈도 우선, 같으면 최신 기록 우선)
        const topEmotion = Object.entries(emotionCounts)
          .filter(([_, count]) => count > 0)
          .sort(([emotionA, countA], [emotionB, countB]) => {
            // 빈도가 다르면 빈도 우선
            if (countB !== countA) {
              return countB - countA;
            }
            // 빈도가 같으면 최신 기록 우선
            const timeA = emotionLatestTime[emotionA as EmotionType];
            const timeB = emotionLatestTime[emotionB as EmotionType];
            return timeB.localeCompare(timeA);
          })[0];

        if (topEmotion) {
          dominantEmotion = topEmotion[0] as EmotionType;
          dominantEntry = emotionLatestEntry[dominantEmotion];

          // 우세한 기록의 키워드에서 상위 2개 선택
          if (dominantEntry?.keywords) {
            topKeywords = dominantEntry.keywords.slice(0, 2);
          }
        }
      }

      // 오늘 날짜를 로컬 시간대 기준으로 생성
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      days.push({
        date: new Date(current),
        dateStr,
        entries: dayEntries,
        dominantEmotion,
        keywords: topKeywords, // 추가된 키워드 정보
        isCurrentMonth: current.getMonth() === currentDate.getMonth(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [startDate, endDate, entries, month, selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      onDateChange?.(newDate);
      return newDate;
    });
  };

  const handleDateClick = (dateStr: string) => {
    // 클릭한 날짜 파싱
    const clickedDate = new Date(dateStr);
    const clickedMonth = clickedDate.getMonth();
    const clickedYear = clickedDate.getFullYear();

    // 현재 표시된 월과 비교
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // 다른 월의 날짜를 클릭한 경우 해당 월로 이동
    if (clickedMonth !== currentMonth || clickedYear !== currentYear) {
      const newDate = new Date(clickedYear, clickedMonth, 1);
      setCurrentDate(newDate);
      onDateChange?.(newDate);
    }

    setSelectedDate(dateStr);
    onDateSelect?.(dateStr);
  };

  return (
    <div
      className={cn(
        'bg-background-primary rounded-lg border border-border-subtle',
        className,
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-background-hover rounded-lg transition-colors"
        >
          ←
        </button>

        <h2 className="text-h3 font-bold text-text-primary">
          {year}년 {month + 1}월
        </h2>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-background-hover rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border-subtle">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={cn(
              'p-3 text-center text-body-small font-medium',
              index === 0
                ? 'text-error'
                : index === 6
                  ? 'text-interactive-primary'
                  : 'text-text-secondary',
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day.dateStr)}
            className={cn(
              'aspect-square p-2 relative group transition-colors',
              // 기본 테두리 설정
              !day.isSelected && 'border border-gray-200',
              // 마지막 열 오른쪽 테두리 제거
              index % 7 === 6 && !day.isSelected && 'border-r-0',
              // 첫 번째 행 상단 테두리 제거
              index < 7 && !day.isSelected && 'border-t-0',
              // 마지막 행 하단 테두리 제거
              index >= calendarDays.length - 7 &&
                !day.isSelected &&
                'border-b-0',
              // 현재 월이 아닌 칸 전체를 흐리게 표시
              !day.isCurrentMonth && 'opacity-50',
              // 오늘 날짜 배경
              day.isToday && !day.isSelected && 'bg-blue-100',
              // 호버 효과 (선택되지 않은 경우만)
              !day.isSelected && 'hover:bg-gray-50',
            )}
            style={{
              // 현재 월 날짜의 테두리를 진하게
              ...(day.isCurrentMonth && !day.isSelected
                ? {
                    borderColor: '#C9D6CB', // sage-40 (strong border)
                    borderWidth: '1px',
                  }
                : {}),
              // 현재 월 날짜의 배경을 약간 진하게
              ...(day.isCurrentMonth && !day.isSelected
                ? {
                    backgroundColor: 'rgba(247, 249, 248, 0.5)', // sage-10 with opacity
                  }
                : {}),
              // 선택된 날짜 스타일
              ...(day.isSelected
                ? {
                    border: '2px solid #B2C5B8', // Sage Green
                    backgroundColor: '#F9F5EF', // Ivory
                  }
                : {}),
            }}
          >
            {/* 날짜 숫자 - 오른쪽 위로 이동 */}
            <div
              className={cn(
                'absolute top-1 right-1 text-body-small',
                // 현재 월 날짜는 폰트를 굵게
                day.isCurrentMonth ? 'font-bold' : 'font-medium',
                day.isToday
                  ? 'text-interactive-primary font-bold'
                  : 'text-text-primary',
              )}
              style={{
                // 현재 월 날짜의 폰트를 확실히 굵게 (인라인 스타일로 강제)
                fontWeight: day.isCurrentMonth ? 'bold' : 'normal',
                // 선택된 날짜는 다크모드에서도 검은색 글씨
                ...(day.isSelected ? { color: '#000000' } : {}),
              }}
            >
              {day.date.getDate()}
            </div>

            {/* 감정 표시 - 중앙에 위치 */}
            {day.dominantEmotion && (
              <div className="flex justify-center items-center h-full">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: `${getEmotionColor(day.dominantEmotion)}40`,
                    border: `1px solid ${getEmotionColor(day.dominantEmotion)}`,
                  }}
                >
                  {getEmotionEmoji(day.dominantEmotion)}
                </div>
              </div>
            )}

            {/* 키워드 표시 - 칸 아래쪽에 위치 */}
            {day.keywords && day.keywords.length > 0 && (
              <div className="absolute bottom-1 left-1 right-1 hidden lg:block">
                <div className="flex flex-wrap gap-1 justify-center">
                  {day.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className={cn(
                        'text-[10px] px-1 py-0.5 rounded bg-interactive-secondary text-text-primary',
                        day.isCurrentMonth ? 'font-medium' : 'font-normal',
                      )}
                      style={{
                        fontSize: '11px',
                        lineHeight: '1.1',
                        // 선택된 날짜는 다크모드에서도 검은색 글씨
                        ...(day.isSelected ? { color: '#000000' } : {}),
                      }}
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 호버 툴팁 */}
            {day.entries.length > 0 && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-caption px-2 py-1 rounded whitespace-nowrap">
                  {day.entries.length}개 기록
                  {day.dominantEmotion && (
                    <span className="ml-1">
                      ({getEmotionEmoji(day.dominantEmotion)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
