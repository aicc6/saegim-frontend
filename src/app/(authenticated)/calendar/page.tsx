'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getLogger } from '@/lib/logger';
import { Calendar, CalendarRef } from '@/components/calendar';
import { EmotionPieChart } from '@/components/charts/EmotionPieChart';
import { KeywordBarChart } from '@/components/charts/KeywordBarChart';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDiaryStore } from '@/stores/diary';
import { useAuthStore } from '@/stores/auth';
import {
  EmotionType,
  EMOTION_COLORS,
  EMOTION_EMOJIS,
  KeywordData,
} from '@/types/diary';
import { cn } from '@/lib/utils';
import { calendarApi } from '@/lib/api/calendar';
import { authApi } from '@/lib/api/auth';

const logger = getLogger('calendar');

export default function CalendarPage() {
  const router = useRouter();
  const {
    diaries,
    fetchDiaries: _fetchDiaries,
    fetchCalendarDiaries: _fetchCalendarDiaries,
    deletedImageIds,
  } = useDiaryStore();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Calendar 컴포넌트에 대한 ref 추가
  const calendarRef = useRef<CalendarRef>(null);

  // 로그인한 사용자의 ID
  const _userId = user?.id;

  // 날짜 범위 계산 - useMemo로 최적화하여 불필요한 재계산 방지
  const dateRange = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return { startDate: startDateStr, endDate: endDateStr };
  }, [viewDate]);

  // 월별 데이터 로딩 함수
  const loadMonthData = useCallback(async () => {
    if (!isAuthenticated) {
      logger.warn('인증되지 않아 데이터를 로드할 수 없습니다.');
      return;
    }

    // 이미 로딩 중이면 중복 호출 방지
    const currentState = useDiaryStore.getState();
    if (currentState.isLoading) {
      logger.debug('이미 로딩 중이어서 중복 호출 방지', {
        isLoading: currentState.isLoading,
        diariesCount: currentState.diaries.length,
      });
      return;
    }

    try {
      logger.info('월별 데이터 로딩 시작', {
        year: viewDate.getFullYear(),
        month: viewDate.getMonth() + 1,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      // 로딩 상태 설정
      useDiaryStore.setState({ isLoading: true, error: null });

      // 쿠키 기반 API 호출
      const response = await calendarApi.fetchCalendarData(
        dateRange.startDate,
        dateRange.endDate,
      );

      if (response.success && response.data) {
        const result = response.data;
        logger.debug('쿠키 기반 API 호출 결과', result);

        // 스토어 상태 업데이트
        if (Array.isArray(result)) {
          // 현재 상태와 비교하여 변경사항이 있을 때만 업데이트
          const currentData = useDiaryStore.getState().diaries;
          const hasChanged =
            JSON.stringify(currentData) !== JSON.stringify(result);

          if (hasChanged) {
            // 삭제된 이미지를 제외하고 필터링하지 않고 원본 데이터 그대로 저장
            useDiaryStore.setState({
              diaries: result,
              isLoading: false,
              error: null,
            });

            logger.info('데이터 로딩 완료', {
              diariesCount: result.length,
            });
          } else {
            // 데이터가 변경되지 않았으면 로딩 상태만 해제
            useDiaryStore.setState({
              isLoading: false,
              error: null,
            });
            logger.debug('데이터 변경사항 없음 (로딩 상태만 해제)');
          }
        }
      } else if (response.message && response.message.includes('401')) {
        logger.warn('인증 실패, 로그인 페이지로 리다이렉트');
        // 인증 실패 시 로그인 페이지로 리다이렉트
        router.push('/login');
      }
    } catch (error) {
      logger.error('API 호출 실패', error);
      useDiaryStore.setState({
        error: '월별 데이터를 불러오는데 실패했습니다.',
        isLoading: false,
      });
    }
  }, [isAuthenticated, viewDate, dateRange, router]);

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
      // 감정 카운트 (AI 감정 사용)
      if (diary.ai_emotion && diary.ai_emotion in emotionCounts) {
        emotionCounts[diary.ai_emotion as EmotionType]++;
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
  }, [diaries, viewDate]);

  // 필터링된 다이어리 목록 (삭제된 이미지 제외)
  const filteredDiaries = useMemo(() => {
    logger.debug('다이어리 필터링 시작', {
      총_다이어리_수: diaries.length,
      삭제된_이미지_ID_수: deletedImageIds.size,
      삭제된_이미지_ID들: Array.from(deletedImageIds),
    });

    const filtered = diaries.map((diary) => ({
      ...diary,
      images: (diary.images || []).filter(
        (img) => !deletedImageIds.has(img.id),
      ),
    }));

    logger.debug('다이어리 필터링 완료', {
      필터링_전_이미지_수: diaries.reduce(
        (sum, d) => sum + (d.images?.length || 0),
        0,
      ),
      필터링_후_이미지_수: filtered.reduce(
        (sum, d) => sum + (d.images?.length || 0),
        0,
      ),
    });

    return filtered;
  }, [diaries, deletedImageIds]);

  // 선택된 날짜의 다이어리
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];

    return filteredDiaries.filter((diary) => {
      const diaryDate = new Date(diary.created_at);
      const selectedDateObj = new Date(selectedDate);
      return (
        diaryDate.getFullYear() === selectedDateObj.getFullYear() &&
        diaryDate.getMonth() === selectedDateObj.getMonth() &&
        diaryDate.getDate() === selectedDateObj.getDate()
      );
    });
  }, [selectedDate, filteredDiaries]);

  // URL 쿼리 파라미터에서 년도와 월 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');
    const monthParam = urlParams.get('month');

    if (yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam) - 1; // getMonth()는 0부터 시작하므로 -1
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        const targetDate = new Date(year, month, 1);
        logger.debug('URL 파라미터에서 년도/월 정보 확인:', {
          year,
          month: month + 1,
          targetDate,
        });
        setViewDate(targetDate);
      }
    }
  }, []);

  // 인증 상태 확인 - 메인 페이지와 동일한 로직
  useEffect(() => {
    logger.debug('useEffect 실행됨 - hasChecked:', hasChecked);

    if (hasChecked) {
      logger.debug('이미 체크됨 - 스킵');
      return;
    }

    const handleAuthCheck = async () => {
      logger.debug('handleAuthCheck 시작');
      try {
        // 인증 상태 확인
        logger.debug('인증 상태 확인:', {
          isAuthenticated,
          hasUser: !!user,
        });

        // 이미 인증된 상태라면 스킵
        if (isAuthenticated && user) {
          logger.debug('이미 인증됨 - 스킵');
          setIsLoading(false);
          setHasChecked(true);
          return;
        }

        // 쿠키 기반 인증 확인 (localStorage 토큰 불필요)
        logger.debug('쿠키 기반 인증 확인 중');

        try {
          logger.debug('서버 인증 확인 중...');

          const response = await authApi.getCurrentUser();

          if (response.success && response.data) {
            const userData = response.data as unknown;
            const userInfo = userData as {
              email?: string;
              user_id?: string;
              nickname?: string;
              provider?: string;
              created_at?: string;
            };
            logger.info(
              '서버 인증 성공:',
              userInfo.email
                ? `${userInfo.email.substring(0, 3)}***@${
                    userInfo.email.split('@')[1]
                  }`
                : '사용자',
            );

            // Zustand 스토어에 로그인 정보 저장
            const { login } = useAuthStore.getState();
            login({
              id: userInfo.user_id || '',
              email: userInfo.email || '',
              name: userInfo.nickname || '',
              profileImage: '',
              provider:
                (userInfo.provider as 'email' | 'google' | 'kakao' | 'naver') ||
                'email',
              createdAt: userInfo.created_at || new Date().toISOString(),
            });

            // 로딩 완료
            setIsLoading(false);
            setHasChecked(true);
          } else {
            logger.warn('서버 인증 실패:', response.message);
            // 서버 인증 실패 시 로그인 페이지로 이동
            setHasChecked(true);
            setIsLoading(false);
            router.push('/login');
          }
        } catch (err) {
          logger.error('서버 인증 확인 실패:', err);
          // 에러 발생 시 로그인 페이지로 이동
          setHasChecked(true);
          setIsLoading(false);
          router.push('/login');
        }
      } catch (err) {
        logger.error('인증 체크 실패:', err);
        setHasChecked(true);
        setIsLoading(false);
        router.push('/login');
      }
    };

    // 약간의 지연을 두어 페이지 로딩 완료 후 인증 확인
    const timer = setTimeout(() => {
      logger.debug('타이머 실행 - 인증 확인 시작');
      handleAuthCheck();
    }, 100);

    return () => {
      logger.debug('useEffect 정리 - 타이머 취소');
      clearTimeout(timer);
    };
  }, [hasChecked, isAuthenticated, router, user]);

  // 페이지 포커스 시 데이터 새로고침 (다이어리 수정 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      logger.debug('페이지 포커스 감지, 데이터 새로고침');
      // 포커스 시에만 데이터 새로고침 (중복 방지)
      if (isAuthenticated) {
        loadMonthData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, loadMonthData]);

  // 월 변경 시 데이터 로드
  useEffect(() => {
    if (isAuthenticated && hasChecked) {
      logger.debug('월 변경 감지, 데이터 로드');
      loadMonthData();
    }
  }, [isAuthenticated, hasChecked, viewDate, loadMonthData]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateChange = useCallback(
    (date: Date) => {
      // 월과 년도만 정확하게 비교 (시간은 무시)
      const isSameMonth =
        viewDate.getMonth() === date.getMonth() &&
        viewDate.getFullYear() === date.getFullYear();

      if (isSameMonth) {
        logger.debug('같은 월이므로 데이터 로드 스킵', {
          oldMonth: viewDate.getMonth() + 1,
          newMonth: date.getMonth() + 1,
          oldYear: viewDate.getFullYear(),
          newYear: date.getFullYear(),
        });
        return;
      }

      logger.debug('다른 월이므로 viewDate 업데이트', {
        oldDate: viewDate,
        newDate: date,
        oldMonth: viewDate.getMonth() + 1,
        newMonth: date.getMonth() + 1,
        oldYear: viewDate.getFullYear(),
        newYear: date.getFullYear(),
      });

      setViewDate(date);
      // useEffect에서 viewDate 변경을 감지하여 자동으로 데이터 로드됨
    },
    [viewDate],
  );

  const clearSelection = () => {
    setSelectedDate(null);
  };

  const handleEntryClick = (entryId: string) => {
    // 현재 페이지 경로와 현재 보고 있는 달 정보를 쿼리 파라미터로 전달
    const currentPath = window.location.pathname;
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
    router.push(
      `/viewPost/${entryId}?from=${encodeURIComponent(currentPath)}&year=${currentYear}&month=${currentMonth}`,
    );
  };

  // 인증 확인 완료 후 인증되지 않았을 때만 리다이렉트
  if (!isAuthenticated || !user) {
    return null; // router.push('/login')이 이미 실행됨
  }

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 ID가 없으면 로딩 표시
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background-primary flex flex-col">
      {/* 페이지 헤더 */}
      <PageHeader
        title="캘린더"
        subtitle="월간 감정 기록과 키워드 분석을 확인하세요"
      />

      <div className="flex flex-1 min-h-0">
        <div className="container mx-auto px-6 py-8">
          {/* 메인 그리드 - 반응형 레이아웃 */}
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
            {/* 캘린더 영역 - 2XL에서는 2/3, 작은 화면에서는 전체 */}
            <div className="2xl:col-span-2">
              {/* 현재 날짜로 가기 버튼 */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    // Calendar 컴포넌트의 goToToday 함수 호출
                    if (calendarRef.current) {
                      calendarRef.current.goToToday();
                    }
                  }}
                  className="border-2 px-4 py-2 rounded-lg transition-colors duration-200 hover:opacity-80 text-text-primary border-sage-40"
                >
                  <span className="text-sm font-bold">
                    {`${new Date().getMonth() + 1} / ${new Date().getDate()}`}
                  </span>
                </button>
              </div>

              <Calendar
                ref={calendarRef}
                key={viewDate.toISOString()}
                onDateSelect={handleDateSelect}
                onDateChange={handleDateChange}
                currentViewDate={viewDate}
                className="h-fit"
              />

              {/* 선택된 날짜 정보 */}
              {selectedDate && (
                <div
                  className="mt-6 bg-background-primary rounded-lg border border-border-subtle p-6"
                  data-date={selectedDate}
                >
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
                            {entry.ai_emotion && (
                              <span
                                className={cn(
                                  'text-lg px-2 py-1 rounded-full',
                                  EMOTION_COLORS[
                                    entry.ai_emotion as EmotionType
                                  ] || 'bg-gray-100 text-gray-800',
                                )}
                              >
                                {EMOTION_EMOJIS[
                                  entry.ai_emotion as EmotionType
                                ] || '😐'}
                              </span>
                            )}
                          </div>

                          {/* AI 생성 텍스트 표시 (ai_generated_text) - 우선 표시 */}
                          {entry.ai_generated_text && (
                            <p className="text-body-small text-text-primary mb-3 line-clamp-3 font-medium">
                              {entry.ai_generated_text}
                            </p>
                          )}

                          {/* 수정된 본문 내용 표시 (ai_generated_text가 없을 때만) */}
                          {!entry.ai_generated_text && entry.content && (
                            <p className="text-body-small text-text-secondary mb-3 line-clamp-2">
                              {entry.content}
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

                          {/* 썸네일 이미지 표시 (최대 3개만 표시) */}
                          {entry.images && entry.images.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {entry.images
                                  .filter((img) => img.thumbnail_path)
                                  .slice(0, 3) // 최대 3개만 표시
                                  .map((image, index) => (
                                    <div
                                      key={index}
                                      className="relative flex-shrink-0"
                                    >
                                      <Image
                                        src={
                                          image.thumbnail_path
                                            ? `${
                                                process.env
                                                  .NEXT_PUBLIC_API_BASE_URL || 
                                                (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
                                              }/api/public/image-proxy?url=${encodeURIComponent(
                                                image.thumbnail_path,
                                              )}`
                                            : ''
                                        }
                                        alt={`다이어리 이미지 ${index + 1}`}
                                        className="rounded-md border border-border-subtle shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                        width={70}
                                        height={70}
                                        style={{
                                          objectFit: 'cover',
                                        }}
                                        loading="lazy" // 지연 로딩 추가
                                        onError={(e) => {
                                          // 이미지 로드 실패 시 처리
                                          logger.warn(
                                            `이미지 로드 실패: ${image.thumbnail_path}`,
                                          );
                                          e.currentTarget.style.display =
                                            'none';
                                        }}
                                      />
                                      {/* 이미지 인덱스 표시 (여러 이미지일 때) */}
                                      {entry.images &&
                                        entry.images.length > 1 && (
                                          <div className="absolute -top-1 -right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded-full min-w-[20px] text-center">
                                            {index + 1}
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                {/* 더 많은 이미지가 있을 때 표시 */}
                                {entry.images.length > 3 && (
                                  <div className="flex items-center justify-center w-[70px] h-[70px] bg-gray-100 rounded-md border border-border-subtle">
                                    <span className="text-xs text-gray-600">
                                      +{entry.images.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 이미지가 없을 때 표시할 내용 */}
                          {(!entry.images || entry.images.length === 0) && (
                            <div className="mb-3 text-center py-3 border border-dashed border-border-subtle rounded-md bg-background-hover">
                              <p className="text-caption text-text-secondary">
                                📷 이미지 없음
                              </p>
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
