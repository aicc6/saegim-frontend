'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

const emotionConfig = {
  happy: {
    emoji: '😊',
    color: 'text-green-500',
    bg: 'bg-green-50',
    label: '기쁨',
  },
  sad: {
    emoji: '😢',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    label: '슬픔',
  },
  angry: {
    emoji: '😡',
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: '화남',
  },
  peaceful: {
    emoji: '😌',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    label: '평온',
  },
  anxious: {
    emoji: '😨',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    label: '불안',
  },
};

interface DiaryCardProps {
  diary: {
    id: number;
    title: string;
    ai_generated_text: string;
    emotion: string;
    date: string;
    keywords: string[];
    thumbnail: string;
  };
  onClick?: () => void;
  onDelete?: (id: number) => void;
}

const DiaryCard = forwardRef<HTMLDivElement, DiaryCardProps>(
  ({ diary, onClick, onDelete }, ref) => {
    const getEmotionEmoji = (emotion: string) => {
      const config = emotionConfig[emotion as keyof typeof emotionConfig];
      if (!config) return '😊';
      return config.emoji;
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
        role="button"
        tabIndex={0}
        className="bg-background-secondary rounded-2xl overflow-hidden border border-border-subtle hover:border-sage-40 transition-colors cursor-pointer group"
      >
        {/* 썸네일 이미지 */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={diary.thumbnail}
            alt={`${diary.title} 썸네일 이미지`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* 감정 이모지 오버레이 */}
          <div className="absolute top-3 left-3">
            <div
              className={`p-2 rounded-xl backdrop-blur-sm bg-white/80 ${
                emotionConfig[diary.emotion as keyof typeof emotionConfig]?.bg
              } flex items-center justify-center`}
            >
              <span className="text-xl">{getEmotionEmoji(diary.emotion)}</span>
            </div>
          </div>
          {/* 삭제 버튼 */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(diary.id);
              }}
              className="absolute top-3 right-3 p-2 rounded-xl backdrop-blur-sm bg-white/80 hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
              aria-label="다이어리 삭제"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </button>
          )}

          {/* 날짜 오버레이 */}
          <div className="absolute bottom-3 right-3">
            <span className="text-caption text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
              {diary.date ? formatDate(diary.date) : '날짜 정보 없음'}
            </span>
          </div>
        </div>

        {/* 카드 콘텐츠 */}
        <div className="p-6">
          {/* 제목 */}
          <h3 className="text-h4 font-semibold text-text-primary group-hover:text-sage-100 transition-colors mb-3 line-clamp-2">
            {diary.title}
          </h3>

          {/* ai 생성 문구 */}
          <p className="text-body text-text-secondary mb-4 line-clamp-3">
            {diary.ai_generated_text || 'AI가 생성한 내용이 없습니다.'}
          </p>

          {/* 키워드 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {diary.keywords.map((keyword: string, keywordIndex: number) => (
              <span
                key={keywordIndex}
                className="px-2 py-1 bg-sage-10 text-sage-100 rounded-full text-caption font-medium"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

DiaryCard.displayName = 'DiaryCard';

export default DiaryCard;
