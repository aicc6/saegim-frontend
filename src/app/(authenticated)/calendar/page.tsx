'use client';

import { useState, useMemo } from 'react';
import { useDiaryStore } from '@/stores/diary';
import { Calendar } from '@/components/calendar/Calendar';
import { EmotionPieChart } from '@/components/charts/EmotionPieChart';
import { KeywordBarChart } from '@/components/charts/KeywordBarChart';
import { Button } from '@/components/ui/custom/Button';
import { DiaryDetailModal } from '@/components/calendar/DiaryDetailModal';
import { formatDate } from '@/lib/utils';

export default function CalendarPage() {
  const {
    getEntriesByDate,
    getEmotionDistribution,
    getKeywordDistribution,
    getKeywordWithEmotionDistribution,
    updateEntry,
    deleteEntry,
  } = useDiaryStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);

  // 현재 보고 있는 월의 데이터
  const currentMonthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    const emotionDistribution = getEmotionDistribution(year, month);
    const keywordDistribution = getKeywordWithEmotionDistribution(year, month);

    // 총 기록 수 계산
    const totalEntries = Object.values(emotionDistribution).reduce(
      (sum, count) => sum + count,
      0,
    );

    // 가장 많은 감정 계산
    const maxEmotion = Object.entries(emotionDistribution)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)[0];

    const emotionLabels = {
      happy: { emoji: '😊', name: '행복' },
      sad: { emoji: '😢', name: '슬픔' },
      angry: { emoji: '😡', name: '화남' },
      peaceful: { emoji: '😌', name: '평온' },
      unrest: { emoji: '😨', name: '불안' },
    };

    const topEmotion = maxEmotion
      ? emotionLabels[maxEmotion[0] as keyof typeof emotionLabels]
      : null;

    return {
      emotionDistribution,
      keywordDistribution,
      totalEntries,
      topEmotion,
    };
  }, [viewDate, getEmotionDistribution, getKeywordDistribution]);

  // 선택된 날짜의 다이어리들
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return getEntriesByDate(selectedDate);
  }, [selectedDate, getEntriesByDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateChange = (date: Date) => {
    setViewDate(date);
  };

  const clearSelection = () => {
    setSelectedDate(null);
  };

  // 모달 관련 핸들러들
  const handleEntryClick = (entry: any, index: number) => {
    setSelectedEntry(entry);
    setCurrentEntryIndex(index);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleEditEntry = (updatedEntry: any) => {
    // 다이어리 스토어에서 엔트리 업데이트
    updateEntry(updatedEntry.id, updatedEntry);

    // 선택된 날짜의 엔트리 목록 업데이트
    const updatedEntries = selectedDateEntries.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry,
    );

    // 선택된 엔트리도 업데이트
    setSelectedEntry(updatedEntry);

    // 강제로 리렌더링을 위해 상태 업데이트
    setSelectedDate(selectedDate);
  };

  const handleDeleteEntry = (entryId: string) => {
    // 다이어리 스토어에서 엔트리 삭제
    deleteEntry(entryId);

    // 선택된 날짜의 엔트리 목록에서 제거
    const updatedEntries = selectedDateEntries.filter(
      (entry) => entry.id !== entryId,
    );

    if (updatedEntries.length === 0) {
      // 해당 날짜에 기록이 없으면 선택 해제
      setSelectedDate(null);
    } else {
      // 현재 선택된 엔트리 인덱스 조정
      if (currentEntryIndex >= updatedEntries.length) {
        setCurrentEntryIndex(updatedEntries.length - 1);
      }
    }

    // 모달 닫기
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentEntryIndex > 0) {
      const newIndex = currentEntryIndex - 1;
      setCurrentEntryIndex(newIndex);
      setSelectedEntry(selectedDateEntries[newIndex]);
    } else if (
      direction === 'next' &&
      currentEntryIndex < selectedDateEntries.length - 1
    ) {
      const newIndex = currentEntryIndex + 1;
      setCurrentEntryIndex(newIndex);
      setSelectedEntry(selectedDateEntries[newIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <div className="flex flex-1">
        <main className="flex-1">
          <div className="container mx-auto px-6 py-8">
            {/* 페이지 헤더 */}
            <div className="mb-8">
              <h1 className="text-h2 font-bold text-text-primary mb-2">
                캘린더
              </h1>
              <p className="text-body text-text-secondary">
                월간 감정 기록과 키워드 분석을 확인하세요
              </p>
            </div>

            {/* 메인 그리드 - 반응형 레이아웃 */}
            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
              {/* 캘린더 영역 - 2XL에서는 2/3, 작은 화면에서는 전체 */}
              <div className="2xl:col-span-2">
                <Calendar
                  onDateSelect={handleDateSelect}
                  onDateChange={handleDateChange}
                  className="h-fit"
                />

                {/* 선택된 날짜 정보 */}
                {selectedDate && (
                  <div className="mt-6 bg-background-primary rounded-lg border border-border-subtle p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-h4 font-bold text-text-primary">
                        {formatDate(selectedDate)} 기록
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                      >
                        ✕
                      </Button>
                    </div>

                    {selectedDateEntries.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDateEntries.map((entry, index) => (
                          <div
                            key={entry.id}
                            className="p-4 bg-background-secondary rounded-lg border border-border-subtle cursor-pointer hover:bg-background-hover hover:border-border-strong transition-all duration-200"
                            onClick={() => handleEntryClick(entry, index)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-body font-medium text-text-primary">
                                {entry.title}
                              </h4>
                              {entry.userEmotion && (
                                <span className="text-lg">
                                  {entry.userEmotion === 'happy' && '😊'}
                                  {entry.userEmotion === 'sad' && '😢'}
                                  {entry.userEmotion === 'angry' && '😡'}
                                  {entry.userEmotion === 'peaceful' && '😌'}
                                  {entry.userEmotion === 'unrest' && '😨'}
                                </span>
                              )}
                            </div>

                            <p className="text-body-small text-text-secondary mb-3 line-clamp-2">
                              {entry.content}
                            </p>

                            {entry.keywords && entry.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {entry.keywords.map((keyword, index) => (
                                  <span
                                    key={index}
                                    className="text-caption px-2 py-1 bg-interactive-secondary text-text-primary rounded-md"
                                  >
                                    #{keyword}
                                  </span>
                                ))}
                              </div>
                            )}
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
                  <EmotionPieChart
                    data={currentMonthData.emotionDistribution}
                  />

                  {/* 키워드 분포 차트 */}
                  <KeywordBarChart
                    data={currentMonthData.keywordDistribution}
                  />

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
        </main>
      </div>

      {/* 다이어리 상세 모달 */}
      <DiaryDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        entry={selectedEntry}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        onNavigate={handleNavigate}
        hasPrev={currentEntryIndex > 0}
        hasNext={currentEntryIndex < selectedDateEntries.length - 1}
      />
    </div>
  );
}
