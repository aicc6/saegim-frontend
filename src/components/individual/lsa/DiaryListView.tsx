'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Next.js 라우터 추가
import {
  Search,
  Filter,
  Calendar,
  Loader2,
  CalendarDays,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useDiaryStore } from '@/stores/diary';
import DiaryCard from './DiaryCard';

export default function DiaryListView() {
  const router = useRouter(); // 라우터 인스턴스 생성
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // 날짜 검색 관련 상태 수정
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    entries: posts,
    isLoading,
    hasMore,
    currentPage,
    fetchPosts,
    loadMorePosts: storeLoadMore,
  } = useDiaryStore();

  const [loading, setLoading] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadMorePosts = useCallback(async () => {
    if (loading || isLoading || !hasMore) return;

    setLoading(true);

    try {
      await storeLoadMore(currentPage + 1);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, loading, isLoading, hasMore, storeLoadMore]);

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePosts();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, isLoading, hasMore, loadMorePosts],
  );

  const handleCardClick = (postId: string) => {
    // 카드 클릭 시 해당 ID의 상세 페이지로 이동
    router.push(`/viewPost/${postId}`);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 날짜 필터링 함수 추가
  const checkDateFilter = (postDate: string) => {
    const today = new Date();
    const postDateTime = new Date(postDate);

    switch (dateFilter) {
      case 'today': {
        const todayStr = today.toISOString().split('T')[0];
        return postDate.startsWith(todayStr);
      }
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return postDateTime >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return postDateTime >= monthAgo;
      }
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // 종료일 끝까지 포함
          return postDateTime >= start && postDateTime <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          return postDateTime >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return postDateTime <= end;
        }
        return true;
      default:
        return true;
    }
  };

  // 필터링된 posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesEmotion =
      selectedEmotion === 'all' || post.userEmotion === selectedEmotion;

    const matchesDate = checkDateFilter(post.createdAt);

    return matchesSearch && matchesEmotion && matchesDate;
  });

  // 정렬된 posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'title':
        return a.title.localeCompare(b.title);
      case 'latest':
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

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
    return dateFilter === 'today'
      ? '오늘'
      : dateFilter === 'week'
        ? '일주일 전'
        : dateFilter === 'month'
          ? '한달 전'
          : '';
  };

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
              placeholder="제목이나 내용, 키워드로 검색하세요"
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
              <option value="unrest">😨 불안</option>
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
                  setShowCalendar(false);
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
              {sortBy === 'latest' ? (
                <SortDesc className="w-5 h-5" />
              ) : (
                <SortAsc className="w-5 h-5" />
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-background-primary border border-border-subtle rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-100 min-w-[120px]"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
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

        {/* 적용된 필터 표시 (선택사항) */}
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
      </div>

      {/* 글목록 - 반응형 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {sortedPosts.map((post, index) => (
          <DiaryCard
            key={post.id}
            ref={index === sortedPosts.length - 1 ? lastPostElementRef : null}
            post={{
              id: parseInt(post.id.replace('entry-', '')),
              title: post.title,
              content: post.content,
              emotion: post.userEmotion || 'happy',
              date: post.createdAt,
              keywords: post.keywords || [],
              thumbnail: `https://picsum.photos/400/200?random=${post.id}`,
            }}
            onClick={() => handleCardClick(post.id)}
          />
        ))}
      </div>

      {/* 로딩 인디케이터 */}
      {(loading || isLoading) && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-sage-100" />
          <span className="ml-2 text-text-secondary">
            더 많은 글을 불러오는 중...
          </span>
        </div>
      )}

      {/* 끝에 도달했을 때 메시지 */}
      {!hasMore && sortedPosts.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <span className="text-text-tertiary">모든 글을 확인했습니다.</span>
        </div>
      )}
    </div>
  );
}
