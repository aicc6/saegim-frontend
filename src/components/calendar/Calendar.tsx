'use client';

import { useMemo, useState, useEffect } from 'react';
import { useDiaryStore } from '@/stores/diary';
import {
  EmotionType,
  DiaryListEntry,
  EMOTION_COLORS,
  EMOTION_EMOJIS,
} from '@/types/diary';
import { cn } from '@/lib/utils';

interface CalendarDay {
  date: Date;
  dateStr: string;
  entries: DiaryListEntry[];
  dominantEmotion: EmotionType | null;
  keywords: string[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  thumbnailPath: string | null; // 썸네일 경로 추가
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

  const { diaries, isLoading, error, fetchCalendarDiaries } = useDiaryStore();

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

  // 날짜 범위 계산 - useMemo로 최적화하여 불필요한 재계산 방지
  const dateRange = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return { startDate: startDateStr, endDate: endDateStr };
  }, [year, month]);

  // 월이 변경될 때마다 해당 월의 다이어리 데이터 가져오기 - 의존성 배열 최적화
  useEffect(() => {
    console.log('🔍 Calendar: API 호출 시작', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    // 실제 백엔드 API 호출 - 쿠키 기반 인증 사용
    const loadCalendarData = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

        const response = await fetch(
          `${apiBaseUrl}/api/diary/calendar?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
          {
            credentials: 'include', // 쿠키 기반 인증
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log('📡 Calendar: 쿠키 기반 API 호출 결과', result);

          // 스토어 상태 업데이트
          if (result.data && Array.isArray(result.data)) {
            // Zustand 스토어 직접 업데이트
            useDiaryStore.setState({
              diaries: result.data,
              totalCount: result.data.length,
              isLoading: false,
              error: null,
            });
          }
        } else if (response.status === 401) {
          console.log('❌ Calendar: 인증 실패, 랜딩 페이지로 리다이렉트');
          window.location.href = '/?status=auth_failed';
        }
      } catch (error) {
        console.error('❌ Calendar: API 호출 실패', error);
        useDiaryStore.setState({
          error: '캘린더 데이터를 불러오는데 실패했습니다.',
          isLoading: false,
        });
      }
    };

    loadCalendarData();
  }, [year, month]); // dateRange 제거하고 year, month만 의존성으로 설정

  // 데이터 로딩 상태 디버깅
  useEffect(() => {
    console.log('📊 Calendar: 데이터 상태', {
      diariesCount: diaries.length,
      isLoading,
      error,
      diaries: diaries.slice(0, 3), // 처음 3개만 로그
    });
  }, [diaries, isLoading, error]);

  // 달력에 표시할 날짜들
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
      const currentYear = current.getFullYear();
      const currentMonth = String(current.getMonth() + 1).padStart(2, '0');
      const currentDay = String(current.getDate()).padStart(2, '0');
      const dateStr = `${currentYear}-${currentMonth}-${currentDay}`;

      const dayEntries = diaries.filter((entry) =>
        entry.created_at.startsWith(dateStr),
      );

      // 해당 날짜의 우세한 감정 선택
      let dominantEmotion: EmotionType | null = null;
      let topKeywords: string[] = [];
      let thumbnailPath: string | null = null;

      if (dayEntries.length > 0) {
        // 감정별 빈도 계산
        const emotionCounts: Record<EmotionType, number> = {
          happy: 0,
          sad: 0,
          angry: 0,
          peaceful: 0,
          unrest: 0, // worried를 unrest로 통일
        };

        dayEntries.forEach((entry) => {
          if (entry.user_emotion && entry.user_emotion in emotionCounts) {
            emotionCounts[entry.user_emotion as EmotionType]++;
          }
        });

        // 가장 빈도가 높은 감정 선택
        const topEmotion = Object.entries(emotionCounts)
          .filter(([_, count]) => count > 0)
          .sort(([_, countA], [__, countB]) => countB - countA)[0];

        if (topEmotion) {
          dominantEmotion = topEmotion[0] as EmotionType;

          // 키워드가 있는 경우 처리
          const firstEntry = dayEntries[0];
          if (firstEntry.keywords && Array.isArray(firstEntry.keywords)) {
            topKeywords = firstEntry.keywords.slice(0, 2);
          }
        }

        // 썸네일 이미지가 있는 첫 번째 다이어리에서 썸네일 경로 가져오기
        for (const entry of dayEntries) {
          if (entry.images && entry.images.length > 0) {
            const imageWithThumbnail = entry.images.find(
              (img) => img.thumbnail_path,
            );
            if (imageWithThumbnail?.thumbnail_path) {
              thumbnailPath = imageWithThumbnail.thumbnail_path;
              break;
            }
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
        keywords: topKeywords,
        isCurrentMonth: current.getMonth() === currentDate.getMonth(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        thumbnailPath, // 썸네일 경로 추가
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [startDate, endDate, diaries, month, selectedDate, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // currentDate가 변경될 때 onDateChange 호출
  useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate);
    }
  }, [currentDate, onDateChange]);

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
      // onDateChange는 useEffect에서 자동으로 호출됨
    }

    setSelectedDate(dateStr);
    onDateSelect?.(dateStr);
  };

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-background-primary rounded-lg border border-border-subtle p-8',
          className,
        )}
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
          <span className="ml-2 text-text-secondary">
            다이어리를 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div
        className={cn(
          'bg-background-primary rounded-lg border border-border-subtle p-8',
          className,
        )}
      >
        <div className="text-center text-error">
          <p className="text-lg font-medium">
            데이터를 불러오는데 실패했습니다
          </p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

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
          className="group flex items-center justify-center w-12 h-10 hover:bg-sage-20 rounded-full transition-all duration-200 hover:scale-105"
          title="이전 달"
        >
          <span className="text-lg group-hover:animate-bounce">◀️</span>
        </button>

        <h2 className="text-h3 font-bold text-text-primary flex items-center gap-2">
          <span className="text-2xl">📅</span>
          {year}년 {month + 1}월
        </h2>

        <button
          onClick={() => navigateMonth('next')}
          className="group flex items-center justify-center w-12 h-10 hover:bg-sage-20 rounded-full transition-all duration-200 hover:scale-105"
          title="다음 달"
        >
          <span className="text-lg group-hover:animate-bounce">▶️</span>
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
              'aspect-square p-2 relative group transition-colors overflow-hidden',
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
            {/* 썸네일 배경 이미지 */}
            {day.thumbnailPath && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={`${
                    process.env.NEXT_PUBLIC_API_BASE_URL ||
                    'http://localhost:8000'
                  }${day.thumbnailPath}`}
                  alt="다이어리 썸네일"
                  className="w-full h-full object-contain opacity-25 hover:opacity-35 transition-opacity duration-200"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </div>
            )}

            {/* 날짜 숫자 - 오른쪽 위로 이동 */}
            <div
              className={cn(
                'absolute top-1 right-1 text-body-small z-10',
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
                // 썸네일이 있을 때 텍스트 가독성 향상
                ...(day.thumbnailPath
                  ? {
                      textShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '4px',
                      padding: '2px 4px',
                    }
                  : {}),
              }}
            >
              {day.date.getDate()}
            </div>

            {/* 감정 표시 - 중앙에 위치 */}
            {day.dominantEmotion && (
              <div className="flex justify-center items-center h-full relative z-10">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                    EMOTION_COLORS[day.dominantEmotion],
                  )}
                  style={{
                    // 썸네일이 있을 때 배경 가독성 향상
                    ...(day.thumbnailPath
                      ? {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
                        }
                      : {}),
                  }}
                >
                  {EMOTION_EMOJIS[day.dominantEmotion]}
                </div>
              </div>
            )}

            {/* 키워드 표시 - 칸 안쪽에 위치 */}
            {day.keywords && day.keywords.length > 0 && (
              <div className="absolute bottom-2 left-1 right-1 relative z-10">
                <div className="flex flex-wrap gap-1 justify-center">
                  {day.keywords
                    .slice(0, 2)
                    .map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className={cn(
                          'text-[9px] px-1 py-0.5 rounded bg-interactive-secondary text-text-primary',
                          day.isCurrentMonth ? 'font-medium' : 'font-normal',
                        )}
                        style={{
                          fontSize: '9px',
                          lineHeight: '1.1',
                          // 선택된 날짜는 다크모드에서도 검은색 글씨
                          ...(day.isSelected ? { color: '#000000' } : {}),
                          // 썸네일이 있을 때 가독성 향상
                          ...(day.thumbnailPath
                            ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                boxShadow: '0 0 2px rgba(0, 0, 0, 0.1)',
                              }
                            : {}),
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
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                <div className="bg-gray-900 text-white text-caption px-2 py-1 rounded whitespace-nowrap">
                  {day.entries.length}개 기록
                  {day.dominantEmotion && (
                    <span className="ml-1">
                      ({EMOTION_EMOJIS[day.dominantEmotion]})
                    </span>
                  )}
                  {day.thumbnailPath && <span className="ml-1">📷</span>}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
