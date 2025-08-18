'use client';

import { forwardRef } from 'react';

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
  calm: {
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
  post: {
    id: number;
    title: string;
    content: string;
    emotion: string;
    date: string;
    keywords: string[];
    thumbnail: string;
  };
  onClick?: () => void;
}

const DiaryCard = forwardRef<HTMLDivElement, DiaryCardProps>(
  ({ post, onClick }, ref) => {
    const getEmotionEmoji = (emotion: string) => {
      const config = emotionConfig[emotion as keyof typeof emotionConfig];
      if (!config) return '😊';
      return config.emoji;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* 감정 이모지 오버레이 */}
          <div className="absolute top-3 left-3">
            <div
              className={`p-2 rounded-xl backdrop-blur-sm bg-white/80 ${
                emotionConfig[post.emotion as keyof typeof emotionConfig]?.bg
              } flex items-center justify-center`}
            >
              <span className="text-xl">{getEmotionEmoji(post.emotion)}</span>
            </div>
          </div>
          {/* 날짜 오버레이 */}
          <div className="absolute bottom-3 right-3">
            <span className="text-caption text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
              {formatDate(post.date)}
            </span>
          </div>
        </div>

        {/* 카드 콘텐츠 */}
        <div className="p-6">
          {/* 제목 */}
          <h3 className="text-h4 font-semibold text-text-primary group-hover:text-sage-100 transition-colors mb-3 line-clamp-2">
            {post.title}
          </h3>

          {/* 내용 미리보기 */}
          <p className="text-body text-text-secondary mb-4 line-clamp-3">
            {post.content}
          </p>

          {/* 키워드 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.keywords.map((keyword: string, keywordIndex: number) => (
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
