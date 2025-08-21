'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/calendar';
import { EmotionPieChart } from '@/components/charts/EmotionPieChart';
import { KeywordBarChart } from '@/components/charts/KeywordBarChart';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDiaryStore } from '@/stores/diary';
import {
  EmotionType,
  EMOTION_COLORS,
  EMOTION_EMOJIS,
  KeywordData,
} from '@/types/diary';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const router = useRouter();
  const { diaries, fetchDiaries, fetchCalendarDiaries } = useDiaryStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // 실제 사용자 ID (데이터베이스에 존재하는 UUID 사용)
  const userId = '2fb9da3c-f58d-45d9-af8d-7031dd27d3b4'; // 실제 UUID 형식 사용

  // 날짜 범위 계산 - useMemo로 최적화하여 불필요한 재계산 방지
  const dateRange = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return { startDate: startDateStr, endDate: endDateStr };
  }, [viewDate.getFullYear(), viewDate.getMonth()]);

  // 페이지 포커스 시 데이터 새로고침 (다이어리 수정 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      console.log('📅 CalendarPage: 페이지 포커스 감지, 데이터 새로고침');
      loadMonthData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 월별 데이터 로딩 함수
  const loadMonthData = useCallback(async () => {
    try {
      console.log('📅 CalendarPage: 월별 데이터 로딩', {
        year: viewDate.getFullYear(),
        month: viewDate.getMonth() + 1,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      // 실제 백엔드 API 호출
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiBaseUrl}/api/diary/?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
      );

      if (response.ok) {
        const result = await response.json();
        console.log('📡 CalendarPage: 직접 API 호출 결과', result);

        // 스토어 상태 업데이트
        if (result.data && Array.isArray(result.data)) {
          useDiaryStore.setState({
            diaries: result.data,
            totalCount: result.data.length,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      console.error('❌ CalendarPage: API 호출 실패', error);
      useDiaryStore.setState({
        error: '월별 데이터를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  }, [viewDate, dateRange]);

  // 현재 보고 있는 월의 데이터
  const currentMonthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    // 현재 월의 다이어리만 필터링
    const currentMonthDiaries = diaries.filter((diary) => {
      const diaryDate = new Date(diary.created_at);
      return (
        diaryDate.getFullYear() === year && diaryDate.getMonth() + 1 === month
      );
    });

    // 감정별 빈도 계산
    const emotionCounts: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      peaceful: 0,
      unrest: 0, // worried를 unrest로 통일
    };

    // 키워드 분포 계산
    const keywordCounts: Record<string, number> = {};

    currentMonthDiaries.forEach((diary) => {
      // 감정 카운트
      if (diary.user_emotion && diary.user_emotion in emotionCounts) {
        emotionCounts[diary.user_emotion as EmotionType]++;
      }

      // 키워드 카운트
      if (diary.keywords && Array.isArray(diary.keywords)) {
        diary.keywords.forEach((keyword: string) => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      }
    });

    // 키워드 분포를 배열로 변환하고 빈도순으로 정렬
    const keywordDistribution: KeywordData[] = Object.entries(keywordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 상위 10개만

    // 총 기록 수 계산
    const totalEntries = currentMonthDiaries.length;

    // 가장 많은 감정 계산
    const maxEmotion = Object.entries(emotionCounts)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)[0];

    const emotionLabels = {
      happy: { emoji: '😊', name: '행복' },
      sad: { emoji: '😢', name: '슬픔' },
      angry: { emoji: '😡', name: '화남' },
      peaceful: { emoji: '😌', name: '평온' },
      unrest: { emoji: '😰', name: '불안' }, // worried를 unrest로 통일
    };

    const topEmotion = maxEmotion
      ? emotionLabels[maxEmotion[0] as keyof typeof emotionLabels]
      : null;

    return {
      emotionDistribution: emotionCounts,
      keywordDistribution,
      totalEntries,
      topEmotion,
    };
  }, [viewDate, diaries]);

  // 선택된 날짜의 다이어리들
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return diaries.filter((diary) => diary.created_at.startsWith(selectedDate));
  }, [selectedDate, diaries]);

  // 월별 데이터 로딩 - 의존성 배열 최적화
  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]); // loadMonthData 함수가 변경될 때마다 실행

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateChange = (date: Date) => {
    setViewDate(date);
  };

  const clearSelection = () => {
    setSelectedDate(null);
  };

  const handleEntryClick = (entryId: string) => {
    router.push(`/viewPost/${entryId}`);
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title="캘린더"
        subtitle="월간 감정 기록과 키워드 분석을 확인하세요"
      />

      <div className="flex flex-1">
        <div className="container mx-auto px-6 py-8">
          {/* 메인 그리드 - 반응형 레이아웃 */}
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
            {/* 캘린더 영역 - 2XL에서는 2/3, 작은 화면에서는 전체 */}
            <div className="2xl:col-span-2">
              <Calendar
                onDateSelect={handleDateSelect}
                onDateChange={handleDateChange}
                className="h-fit"
                userId={userId}
              />

              {/* 선택된 날짜 정보 */}
              {selectedDate && (
                <div className="mt-6 bg-background-primary rounded-lg border border-border-subtle p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h4 font-bold text-text-primary">
                      {selectedDate} 기록
                    </h3>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      ✕
                    </Button>
                  </div>

                  {selectedDateEntries.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDateEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 bg-background-secondary rounded-lg border border-border-subtle cursor-pointer hover:bg-background-hover transition-colors"
                          onClick={() => handleEntryClick(entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleEntryClick(entry.id);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`${entry.title} 기록 보기`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-body font-medium text-text-primary">
                              {entry.title}
                            </h4>
                            {entry.user_emotion && (
                              <span
                                className={cn(
                                  'text-lg px-2 py-1 rounded-full',
                                  EMOTION_COLORS[
                                    entry.user_emotion as EmotionType
                                  ] || 'bg-gray-100 text-gray-800',
                                )}
                              >
                                {EMOTION_EMOJIS[
                                  entry.user_emotion as EmotionType
                                ] || '😐'}
                              </span>
                            )}
                          </div>

                          {/* 수정된 본문 내용 표시 (content) - 우선 표시 */}
                          {entry.content && (
                            <p className="text-body-small text-text-primary mb-3 line-clamp-3 font-medium">
                              {entry.content}
                            </p>
                          )}

                          {/* AI 생성 텍스트 표시 (content가 없을 때만) */}
                          {!entry.content && entry.ai_generated_text && (
                            <p className="text-body-small text-text-secondary mb-3 line-clamp-2">
                              {entry.ai_generated_text}
                            </p>
                          )}

                          {/* keywords 표시 */}
                          {entry.keywords && entry.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {entry.keywords.map(
                                (keyword: string, index: number) => (
                                  <span
                                    key={index}
                                    className="text-caption px-2 py-1 bg-interactive-secondary text-text-primary rounded-md"
                                  >
                                    #{keyword}
                                  </span>
                                ),
                              )}
                            </div>
                          )}

                          {/* 클릭 안내 메시지 */}
                          <div className="text-right">
                            <span className="text-caption text-interactive-primary">
                              클릭하여 상세 보기 →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-text-secondary">
                        이 날에는 기록이 없습니다
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 차트 영역 - 2XL에서는 1/3, 작은 화면에서는 캘린더 아래 전체 */}
            <div className="2xl:col-span-1">
              {/* 2XL 이상: 세로 배치 */}
              <div className="hidden 2xl:block space-y-6">
                {/* 감정 분포 차트 */}
                <EmotionPieChart data={currentMonthData.emotionDistribution} />

                {/* 키워드 분포 차트 */}
                <KeywordBarChart data={currentMonthData.keywordDistribution} />

                {/* 월간 요약 */}
                <div className="bg-background-primary rounded-lg border border-border-subtle p-6">
                  <h3 className="text-h4 font-bold text-text-primary mb-4">
                    이달의 요약
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-body-small text-text-secondary">
                        총 기록 수
                      </span>
                      <span className="text-body font-medium text-text-primary">
                        {currentMonthData.totalEntries}개
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-body-small text-text-secondary">
                        가장 많은 감정
                      </span>
                      <span className="text-body font-medium text-text-primary">
                        {currentMonthData.topEmotion?.name || '기록 없음'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-body-small text-text-secondary">
                        주요 키워드
                      </span>
                      <span className="text-body font-medium text-text-primary">
                        {currentMonthData.keywordDistribution[0]?.word ||
                          '없음'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2XL 미만: 1280px 이상에서는 가로 배치, 1280px 미만에서는 세로 배치 */}
              <div className="block 2xl:hidden">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  {/* 감정 분포 차트 - 더 넓은 공간 할당 */}
                  <div className="xl:col-span-2">
                    <EmotionPieChart
                      data={currentMonthData.emotionDistribution}
                    />
                  </div>

                  {/* 키워드 분포 차트 - 작은 공간 할당 */}
                  <div className="xl:col-span-2">
                    <KeywordBarChart
                      data={currentMonthData.keywordDistribution}
                    />
                  </div>

                  {/* 월간 요약 - 가장 작은 공간 할당 */}
                  <div className="xl:col-span-1">
                    <div className="bg-background-primary rounded-lg border border-border-subtle p-6">
                      <h3 className="text-h4 font-bold text-text-primary mb-4">
                        이달의 요약
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-text-secondary">
                            총 기록 수
                          </span>
                          <span className="text-body font-medium text-text-primary">
                            {currentMonthData.totalEntries}개
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-text-secondary">
                            가장 많은 감정
                          </span>
                          <span className="text-body font-medium text-text-primary">
                            {currentMonthData.topEmotion?.name || '기록 없음'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-body-small text-text-secondary">
                            주요 키워드
                          </span>
                          <span className="text-body font-medium text-text-primary">
                            {currentMonthData.keywordDistribution[0]?.word ||
                              '없음'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
