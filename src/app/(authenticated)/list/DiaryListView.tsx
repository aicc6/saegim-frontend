'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Calendar,
  Loader2,
  CalendarDays,
  SortAsc,
  SortDesc,
} from 'lucide-react';

import DeleteConfirmModal from '@/components/diary/DeleteConfirmModal';
import { useToast } from '@/hooks/use-toast';
import { useDiaryStore } from '@/stores/diary';
import { logger } from '@/lib';
import { type DiaryFilters } from '@/types/diary';
import { addDays, addMonths, toDateString } from '@/lib/utils';
import DiaryCard from './DiaryCard';

export default function DiaryListView() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 날짜 검색 관련 상태
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // store에서 상태와 액션 가져오기 (Store에 실제로 있는 것만)
  const {
    diaries,
    isLoading,
    error,
    totalCount,
    currentPage, // hasNextPage 대신 currentPage 사용
    fetchDiaries,
    deleteDiary,
    clearError,
  } = useDiaryStore();

  // 무한스크롤용 Observer
  const observer = useRef<IntersectionObserver | null>(null);

  // 필터 객체 생성 함수
  const buildFilters = useCallback(
    (page: number = 1): DiaryFilters => {
      const filters: DiaryFilters = {
        page,
        page_size: 20,
        sort_order: sortOrder,
      };

      // 검색어 추가
      if (searchTerm.trim()) {
        filters.searchTerm = searchTerm.trim();
      }

      // 감정 필터
      if (selectedEmotion !== 'all') {
        filters.emotion = selectedEmotion;
      }

      // 날짜 필터
      if (dateFilter === 'custom') {
        if (startDate) filters.start_date = startDate;
        if (endDate) filters.end_date = endDate;
      } else if (dateFilter !== 'all') {
        const today = new Date();

        switch (dateFilter) {
          case 'today': {
            const todayStr = toDateString(today);
            filters.start_date = todayStr;
            filters.end_date = todayStr;
            break;
          }
          case 'week': {
            const weekAgo = addDays(today, -7);
            filters.start_date = toDateString(weekAgo);
            break;
          }
          case 'month': {
            const monthAgo = addMonths(today, -1);
            filters.start_date = toDateString(monthAgo);
            break;
          }
        }
      }

      return filters;
    },
    [searchTerm, selectedEmotion, sortOrder, dateFilter, startDate, endDate],
  );

  // 간단한 무한스크롤 로드 함수 (Store의 fetchDiaries만 사용)
  const loadMore = useCallback(async () => {
    if (isLoading) return;

    try {
      const filters = buildFilters(currentPage + 1);
      await fetchDiaries(filters);
    } catch (loadError) {
      logger.error('Failed to load more diaries:', loadError);
    }
  }, [isLoading, currentPage, buildFilters, fetchDiaries]);

  // hasNextPage 로직을 간단하게 계산
  const hasNextPage = diaries.length > 0 && diaries.length % 20 === 0;

  const lastDiaryElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, loadMore, hasNextPage],
  );

  // 검색 및 필터 적용
  const applyFilters = useCallback(async () => {
    try {
      clearError();
      const filters = buildFilters(1); // 첫 페이지부터 시작
      await fetchDiaries(filters);
    } catch (filterError) {
      logger.error('Failed to apply filters:', filterError);
    }
  }, [buildFilters, fetchDiaries, clearError]);

  // 카드 클릭 핸들러
  const handleCardClick = (diaryId: string) => {
    // 현재 페이지 경로를 from 파라미터로 전달
    const currentPath = '/list';
    router.push(`/viewPost/${diaryId}?from=${encodeURIComponent(currentPath)}`);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (diaryId: string, diaryTitle: string) => {
    setDiaryToDelete({ id: diaryId, title: diaryTitle });
    setDeleteModalOpen(true);
  };

  // 삭제 확인 핸들러
  const handleDeleteConfirm = useCallback(async () => {
    if (!diaryToDelete) return;

    try {
      await deleteDiary(diaryToDelete.id);
      toast({
        title: '삭제 완료',
        description: '다이어리가 성공적으로 삭제되었습니다.',
      });
      setDeleteModalOpen(false);
      setDiaryToDelete(null);
    } catch (deleteError) {
      logger.error('Failed to delete diary:', deleteError);
      toast({
        title: '삭제 실패',
        description: '다이어리 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  }, [diaryToDelete, deleteDiary, toast]);

  // 삭제 모달 닫기 핸들러
  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setDiaryToDelete(null);
  };

  // 초기 데이터 로드 및 필터 변경 시 재로드
  useEffect(() => {
    applyFilters();
  }, [
    selectedEmotion,
    dateFilter,
    startDate,
    endDate,
    sortOrder,
    applyFilters,
  ]);

  // 검색어는 디바운스 적용
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timeoutId);
  }, [searchTerm, applyFilters]);

  // 날짜 범위 표시 텍스트 생성
  const getDateRangeText = () => {
    if (dateFilter === 'custom') {
      if (startDate && endDate) {
        return `${startDate} ~ ${endDate}`;
      } else if (startDate) {
        return `${startDate} 이후`;
      } else if (endDate) {
        return `${endDate} 이전`;
      }
      return '기간 선택';
    }

    const dateLabels: Record<string, string> = {
      today: '오늘',
      week: '일주일 전',
      month: '한달 전',
    };

    return dateLabels[dateFilter] || '';
  };

  // 에러 처리
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">오류가 발생했습니다: {error}</div>
        <button
          onClick={() => {
            clearError();
            applyFilters();
          }}
          className="px-4 py-2 bg-sage-100 text-white rounded-lg hover:bg-sage-120"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-background-secondary rounded-2xl p-6 border border-border-subtle space-y-4">
        {/* 첫 번째 줄: 제목/내용 검색창 */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
            <input
              type="text"
              placeholder="제목이나 내용으로 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-sage-100 focus:border-transparent"
            />
          </div>
        </div>

        {/* 두 번째 줄: 필터 옵션들 */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 감정 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-tertiary" />
            <select
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value)}
              className="px-4 py-3 bg-background-primary border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100 min-w-[140px]"
            >
              <option value="all">모든 감정</option>
              <option value="happy">😊 기쁨</option>
              <option value="sad">😢 슬픔</option>
              <option value="angry">😡 화남</option>
              <option value="peaceful">😌 평온</option>
              <option value="unrest">� 불안</option>
            </select>
          </div>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-text-tertiary" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="px-4 py-3 bg-background-primary border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100 min-w-[140px]"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="week">일주일 전</option>
              <option value="month">한달 전</option>
              <option value="custom">기간 선택</option>
            </select>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 text-text-tertiary">
              {sortOrder === 'desc' ? (
                <SortDesc className="w-5 h-5" />
              ) : (
                <SortAsc className="w-5 h-5" />
              )}
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-4 py-3 bg-background-primary border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100 min-w-[120px]"
            >
              <option value="desc">최신순</option>
              <option value="asc">오래된순</option>
            </select>
          </div>
        </div>

        {/* 날짜 범위 선택 (custom 선택 시에만 표시) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-background-primary rounded-xl border border-border-subtle">
            <Calendar className="w-5 h-5 text-text-tertiary" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="startDate"
                  className="text-text-secondary text-sm whitespace-nowrap"
                >
                  시작일:
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-background-secondary border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              </div>
              <span className="text-text-tertiary">~</span>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="endDate"
                  className="text-text-secondary text-sm whitespace-nowrap"
                >
                  종료일:
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className="px-3 py-2 bg-background-secondary border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-text-tertiary hover:text-text-secondary text-sm"
            >
              초기화
            </button>
          </div>
        )}

        {/* 적용된 필터 표시 */}
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="px-3 py-1 bg-sage-10 text-sage-100 rounded-full text-sm flex items-center gap-1">
              검색: &quot;{searchTerm}&quot;
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 text-sage-80 hover:text-sage-100"
              >
                ×
              </button>
            </span>
          )}
          {selectedEmotion !== 'all' && (
            <span className="px-3 py-1 bg-sage-10 text-sage-100 rounded-full text-sm flex items-center gap-1">
              감정:{' '}
              {selectedEmotion === 'happy'
                ? '😊 기쁨'
                : selectedEmotion === 'sad'
                  ? '😢 슬픔'
                  : selectedEmotion === 'angry'
                    ? '😡 화남'
                    : selectedEmotion === 'peaceful'
                      ? '😌 평온'
                      : '😨 불안'}
              <button
                onClick={() => setSelectedEmotion('all')}
                className="ml-1 text-sage-80 hover:text-sage-100"
              >
                ×
              </button>
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className="px-3 py-1 bg-sage-10 text-sage-100 rounded-full text-sm flex items-center gap-1">
              기간: {getDateRangeText()}
              <button
                onClick={() => {
                  setDateFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-1 text-sage-80 hover:text-sage-100"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* 검색 결과 개수 표시 */}
        <div className="text-text-secondary text-sm">
          총 {totalCount}개의 일기 중 {diaries.length}개 표시
        </div>
      </div>

      {/* 글목록 - 반응형 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {diaries.map((diary, index) => (
          <DiaryCard
            key={diary.id}
            ref={index === diaries.length - 1 ? lastDiaryElementRef : null}
            diary={{
              id: Number(diary.id),
              title: diary.title || '',
              ai_generated_text: diary.ai_generated_text || '',
              emotion:
                (diary.ai_emotion as string) ||
                (diary.user_emotion as string) ||
                'peaceful',
              date: diary.created_at || '',
              keywords: diary.keywords || [],
              thumbnail:
                diary.images && diary.images.length > 0
                  ? diary.images[0].thumbnail_path || diary.images[0].file_path
                  : `https://picsum.photos/400/200?random=${diary.id}`,
            }}
            onClick={() => handleCardClick(diary.id.toString())}
            onDelete={(_) =>
              handleDeleteClick(diary.id.toString(), diary.title || '제목 없음')
            }
          />
        ))}
      </div>

      {/* 빈 결과 메시지 */}
      {!isLoading && diaries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-text-tertiary text-lg mb-2">
            검색 결과가 없습니다
          </div>
          <div className="text-text-quaternary text-sm">
            다른 검색어나 필터를 시도해보세요
          </div>
        </div>
      )}

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-sage-100" />
          <span className="ml-2 text-text-secondary">
            더 많은 글을 불러오는 중...
          </span>
        </div>
      )}

      {/* 끝에 도달했을 때 메시지 */}
      {!isLoading && diaries.length > 0 && !hasNextPage && (
        <div className="flex justify-center items-center py-8">
          <span className="text-text-tertiary">모든 글을 확인했습니다.</span>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        diaryTitle={diaryToDelete?.title}
        isLoading={isLoading}
      />
    </div>
  );
}
