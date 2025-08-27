'use client';

import {
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
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
  allImages: string[]; // 모든 이미지 경로 추가
  currentImageIndex: number; // 현재 표시 중인 이미지 인덱스 추가
}

interface CalendarProps {
  className?: string;
  onDateSelect?: (date: string) => void;
  onDateChange?: (date: Date) => void;
  currentViewDate?: Date; // 현재 보고 있는 날짜 추가
}

export interface CalendarRef {
  goToToday: () => void;
}

export const Calendar = forwardRef<CalendarRef, CalendarProps>(
  (
    {
      className,
      onDateSelect,
      onDateChange,
      currentViewDate, // props 추가
    },
    ref,
  ) => {
    const [currentDate, setCurrentDate] = useState(
      currentViewDate || new Date(),
    );
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [imageIndices, setImageIndices] = useState<Record<string, number>>(
      {},
    );

    const { diaries, isLoading, error, fetchCalendarDiaries, deletedImageIds } =
      useDiaryStore();

    // props로 전달받은 날짜가 있으면 사용, 없으면 내부 상태 사용
    const effectiveDate = currentViewDate || currentDate;
    const year = effectiveDate.getFullYear();
    const month = effectiveDate.getMonth();

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
      // year와 month는 이미 올바른 값이므로 그대로 사용
      const startDate = new Date(year, month, 1); // month - 1 제거
      const endDate = new Date(year, month + 1, 0); // month + 1로 다음 월의 0일 = 현재 월의 마지막 날

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('📅 Calendar: 날짜 범위 계산', {
        year,
        month,
        startDate: startDateStr,
        endDate: endDateStr,
        startDateObj: startDate,
        endDateObj: endDate,
      });

      return { startDate: startDateStr, endDate: endDateStr };
    }, [year, month]);

    // 월이 변경될 때마다 해당 월의 다이어리 데이터 가져오기 - 의존성 배열 최적화
    useEffect(() => {
      console.log('🔍 Calendar: 데이터 상태 확인', {
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
            console.log('❌ Calendar: 인증 실패, 로그인 페이지로 리다이렉트');
            window.location.href = '/login';
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
        deletedImageIdsCount: deletedImageIds.size,
        deletedImageIds: Array.from(deletedImageIds),
        diaries: diaries.slice(0, 3), // 처음 3개만 로그
      });
    }, [diaries, isLoading, error, deletedImageIds]);

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
        const allImages: string[] = [];

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

          // 모든 이미지 수집 (삭제된 이미지 제외)
          dayEntries.forEach((entry) => {
            if (entry.images && entry.images.length > 0) {
              const validImages = entry.images.filter(
                (img) => img.thumbnail_path && !deletedImageIds.has(img.id),
              );

              validImages.forEach((img) => {
                if (img.thumbnail_path) {
                  allImages.push(img.thumbnail_path);
                }
              });
            }
          });

          // 썸네일 이미지가 있는 첫 번째 다이어리에서 썸네일 경로 가져오기
          // deletedImageIds를 명확하게 구독하여 필터링
          for (const entry of dayEntries) {
            if (entry.images && entry.images.length > 0) {
              // 삭제된 이미지는 제외하고 필터링 - deletedImageIds 상태를 직접 참조
              const validImages = entry.images.filter(
                (img) => img.thumbnail_path && !deletedImageIds.has(img.id),
              );

              if (validImages.length > 0) {
                thumbnailPath = validImages[0].thumbnail_path;
                console.log('📷 Calendar: 썸네일 이미지 설정', {
                  date: dateStr,
                  imageId: validImages[0].id,
                  thumbnailPath: validImages[0].thumbnail_path,
                  deletedImageIds: Array.from(deletedImageIds),
                });
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
          isCurrentMonth: current.getMonth() === effectiveDate.getMonth(),
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDate,
          thumbnailPath, // 썸네일 경로 추가
          allImages, // 모든 이미지 경로 추가
          currentImageIndex: 0, // 현재 표시 중인 이미지 인덱스 초기화
        });

        current.setDate(current.getDate() + 1);
      }

      return days;
    }, [
      startDate,
      endDate,
      diaries,
      month,
      selectedDate,
      currentDate,
      effectiveDate,
      deletedImageIds, // 이미지 삭제 상태 변화 감지 - 명시적으로 구독
    ]);

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(effectiveDate);

      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }

      setCurrentDate(newDate);

      // 부모 컴포넌트에 날짜 변경 알림
      if (onDateChange) {
        onDateChange(newDate);
      }

      console.log('📅 Calendar: 월 변경', {
        direction,
        oldDate: effectiveDate,
        newDate,
        oldMonth: effectiveDate.getMonth() + 1,
        newMonth: newDate.getMonth() + 1,
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

      // 다이어리 기록 섹션이 화면 중앙에 오도록 스크롤 조정
      setTimeout(() => {
        // 다이어리 기록 섹션을 찾기 (h3 제목으로 찾기)
        const recordTitle = Array.from(document.querySelectorAll('h3')).find(
          (h3) =>
            h3.textContent?.includes(dateStr) &&
            h3.textContent?.includes('기록'),
        );

        if (recordTitle) {
          // h3 제목의 더 큰 부모 컨테이너를 찾아서 전체 섹션으로 사용
          const diarySection =
            recordTitle.closest('div[class*="flex"]') ||
            recordTitle.closest('div');

          if (diarySection) {
            // 다이어리 기록 섹션이 화면 중앙에 오도록 스크롤
            const rect = diarySection.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // 세로 중앙 정렬 (다이어리 기록 섹션의 중앙이 화면 중앙에 오도록)
            const scrollTop =
              window.pageYOffset +
              rect.top -
              windowHeight / 2 +
              rect.height / 2;

            window.scrollTo({
              top: scrollTop,
              behavior: 'smooth',
            });

            console.log('📅 Calendar: 다이어리 기록 섹션 스크롤 완료', {
              dateStr,
              scrollTop,
              sectionTop: rect.top,
              sectionHeight: rect.height,
              windowHeight,
              titleText: recordTitle.textContent,
            });
          }
        } else {
          console.log(
            '❌ Calendar: 다이어리 기록 섹션을 찾을 수 없습니다.',
            dateStr,
          );
        }
      }, 800); // 다이어리 기록이 렌더링된 후 스크롤 조정 (시간 증가)
    };

    // 오늘 날짜로 이동하는 함수
    const goToToday = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 오늘 날짜가 현재 표시된 월에 없으면 해당 월로 이동
      if (
        today.getMonth() !== effectiveDate.getMonth() ||
        today.getFullYear() !== effectiveDate.getFullYear()
      ) {
        setCurrentDate(today);
      }

      // 오늘 날짜 선택
      setSelectedDate(todayStr);
      onDateSelect?.(todayStr);

      // 오늘 날짜가 화면 중앙에 오도록 스크롤 조정
      setTimeout(() => {
        const todayElement = document.querySelector(
          `[data-date="${todayStr}"]`,
        );
        if (todayElement) {
          // 화면 중앙에 정확히 위치하도록 스크롤 조정
          const rect = todayElement.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;

          // 세로 중앙 정렬
          const scrollTop =
            window.pageYOffset + rect.top - windowHeight / 2 + rect.height / 2;

          // 가로 중앙 정렬
          const scrollLeft =
            window.pageXOffset + rect.left - windowWidth / 2 + rect.width / 2;

          window.scrollTo({
            top: scrollTop,
            left: scrollLeft,
            behavior: 'smooth',
          });
        }
      }, 100);
    };

    // useImperativeHandle을 사용하여 ref를 통해 함수 노출
    useImperativeHandle(ref, () => ({
      goToToday,
    }));

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
              data-date={day.dateStr}
              className={cn(
                'aspect-square p-2 relative transition-colors overflow-hidden',
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
                }}
              >
                {day.date.getDate()}
              </div>

              {/* 이미지 썸네일 뷰 - 상단 가운데에 배치 */}
              {day.allImages && day.allImages.length > 0 && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 relative z-10">
                  <div className="flex justify-center overflow-hidden">
                    {/* 한 번에 하나의 이미지만 표시 */}
                    <div
                      className="flex-shrink-0 relative group cursor-pointer overflow-hidden"
                      style={{
                        width: 'clamp(40px, 8vw, 90px)',
                        height: 'clamp(30px, 6vw, 80px)',
                        maxWidth: '70%',
                        maxHeight: '40%',
                      }}
                      onClick={(e) => {
                        // 이벤트 전파를 막아서 날짜 선택이 되지 않도록 함
                        e.stopPropagation();

                        // 다음 이미지로 넘어가는 로직
                        if (day.allImages.length > 1) {
                          const currentIndex = imageIndices[day.dateStr] || 0;
                          const nextIndex =
                            (currentIndex + 1) % day.allImages.length;

                          // 상태 업데이트로 리렌더링 트리거
                          setImageIndices((prev) => ({
                            ...prev,
                            [day.dateStr]: nextIndex,
                          }));

                          console.log(
                            '다음 이미지로 넘어감:',
                            nextIndex,
                            day.allImages[nextIndex],
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        // 이벤트 전파를 막아서 날짜 선택이 되지 않도록 함
                        e.stopPropagation();

                        if (e.key === 'Enter' || e.key === ' ') {
                          // 다음 이미지로 넘어가는 로직
                          if (day.allImages.length > 1) {
                            const currentIndex = imageIndices[day.dateStr] || 0;
                            const nextIndex =
                              (currentIndex + 1) % day.allImages.length;

                            setImageIndices((prev) => ({
                              ...prev,
                              [day.dateStr]: nextIndex,
                            }));

                            console.log(
                              '다음 이미지로 넘어감 (키보드):',
                              nextIndex,
                              day.allImages[nextIndex],
                            );
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="다음 이미지로 넘어가기"
                    >
                      <img
                        src={`${
                          process.env.NEXT_PUBLIC_API_BASE_URL ||
                          'http://localhost:8000'
                        }/api/public/image-proxy?url=${encodeURIComponent(day.allImages[imageIndices[day.dateStr] || 0])}`}
                        alt="다이어리 이미지"
                        className="w-full h-full object-contain rounded-sm border border-white shadow-sm transition-all duration-200 bg-gray-50"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          maxHeight: '100%',
                          maxWidth: '100%',
                        }}
                        onError={(e) => {
                          // 이미지 로드 실패 시 처리
                          console.warn(
                            `캘린더 썸네일 이미지 로드 실패: ${day.allImages[imageIndices[day.dateStr] || 0]}`,
                          );
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* 마우스 호버 시에만 화살표 표시 (2개 이상 이미지일 때) */}
                      {day.allImages.length > 1 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 text-white text-xs flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          →
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 감정과 키워드를 하단에 배치 */}
              {(day.dominantEmotion ||
                (day.keywords && day.keywords.length > 0)) && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 relative z-10">
                  <div className="flex flex-col items-center gap-1">
                    {/* 이모티콘 */}
                    {day.dominantEmotion && (
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-xs',
                          EMOTION_COLORS[day.dominantEmotion],
                        )}
                      >
                        {EMOTION_EMOJIS[day.dominantEmotion]}
                      </div>
                    )}

                    {/* 키워드 */}
                    {day.keywords && day.keywords.length > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        {day.keywords
                          .slice(0, 2)
                          .map((keyword: string, index: number) => (
                            <span
                              key={index}
                              className={cn(
                                'text-[8px] px-1 py-0.5 rounded text-text-primary font-medium',
                                day.isCurrentMonth
                                  ? 'font-medium'
                                  : 'font-normal',
                              )}
                              style={{
                                fontSize: '8px',
                                lineHeight: '1.1',
                                backgroundColor: day.dominantEmotion
                                  ? day.dominantEmotion === 'happy'
                                    ? '#FEF3C7' // bg-yellow-100
                                    : day.dominantEmotion === 'sad'
                                      ? '#DBEAFE' // bg-blue-100
                                      : day.dominantEmotion === 'angry'
                                        ? '#FFEDD5' // bg-orange-100
                                        : day.dominantEmotion === 'peaceful'
                                          ? '#DCFCE7' // bg-green-100
                                          : '#F3E8FF' // bg-purple-100 (unrest)
                                  : 'rgba(0,0,0,0.1)',
                                // 선택된 날짜는 다크모드에서도 검은색 글씨
                                ...(day.isSelected ? { color: '#000000' } : {}),
                              }}
                            >
                              #{keyword}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 호버 툴팁 */}
              {day.entries.length > 0 && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-caption px-2 py-1 rounded whitespace-nowrap">
                    {day.entries.length}개 기록
                    {day.dominantEmotion && (
                      <span className="ml-1">
                        ({EMOTION_EMOJIS[day.dominantEmotion]})
                      </span>
                    )}
                    {day.allImages && day.allImages.length > 0 && (
                      <span className="ml-1">📷 {day.allImages.length}장</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

Calendar.displayName = 'Calendar';
