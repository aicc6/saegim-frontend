'use client';

import { useState, useEffect } from 'react';
import { EmotionType } from '@/types';
import { getEmotionColor, cn } from '@/lib/utils';

interface AIQuote {
  text: string;
  emotion: EmotionType;
  author: string;
  image: string;
}

const sampleQuotes: AIQuote[] = [
  {
    text: '따스한 햇살처럼 밝은 하루,\n마음에 피어나는 행복의 꽃잎이\n바람에 흩날리며 춤을 춘다.',
    emotion: 'happy',
    author: 'AI가 그려낸 행복',
    image: '/images/happy-bg.jpg',
  },
  {
    text: '회색 구름 사이로 스며드는\n작은 빛줄기를 바라보며\n마음의 비가 그칠 때를 기다린다.',
    emotion: 'sad',
    author: 'AI가 위로하는 슬픔',
    image: '/images/sad-bg.jpg',
  },
  {
    text: '고요한 숲속에서 듣는\n새들의 지저귐처럼\n마음에도 평화가 찾아왔다.',
    emotion: 'peaceful',
    author: 'AI가 선사하는 평온',
    image: '/images/peaceful-bg.jpg',
  },
  {
    text: '안개 낀 새벽길을 걷듯\n불안한 마음이지만\n해가 뜨면 길이 보일 것이다.',
    emotion: 'unrest',
    author: 'AI가 건네는 희망',
    image: '/images/unrest-bg.jpg',
  },
  {
    text: '거센 바람처럼 휘몰아치는 마음,\n잔잔한 호수가 되기까지\n시간이 필요한 오늘이다.',
    emotion: 'angry',
    author: 'AI가 달래는 분노',
    image: '/images/angry-bg.jpg',
  },
];

interface AIQuoteCardProps {
  className?: string;
}

export function AIQuoteCard({ className }: AIQuoteCardProps) {
  const [currentQuote, setCurrentQuote] = useState<AIQuote>(sampleQuotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        const nextIndex =
          (sampleQuotes.indexOf(currentQuote) + 1) % sampleQuotes.length;
        setCurrentQuote(sampleQuotes[nextIndex]);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentQuote]);

  const nextQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const nextIndex =
        (sampleQuotes.indexOf(currentQuote) + 1) % sampleQuotes.length;
      setCurrentQuote(sampleQuotes[nextIndex]);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div
      className={cn(
        'relative max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-card-hover transition-all duration-500',
        className,
      )}
    >
      {/* 배경 그라데이션 */}
      <div
        className="absolute inset-0 opacity-20 transition-all duration-1000"
        style={{
          background: `linear-gradient(135deg, ${getEmotionColor(currentQuote.emotion)}40, ${getEmotionColor(currentQuote.emotion)}10)`,
        }}
      />

      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full bg-repeat opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="relative p-8 md:p-12">
        <div
          className={cn(
            'transition-all duration-300',
            isAnimating
              ? 'opacity-0 transform translate-y-4'
              : 'opacity-100 transform translate-y-0',
          )}
        >
          {/* AI 글귀 */}
          <blockquote className="ai-poem text-text-primary mb-6">
            {currentQuote.text.split('\n').map((line, index) => (
              <div key={index} className="block leading-relaxed">
                {line}
              </div>
            ))}
          </blockquote>

          {/* 작성자 및 감정 표시 */}
          <div className="flex items-center justify-between">
            <cite className="text-body-small text-text-secondary not-italic">
              — {currentQuote.author}
            </cite>

            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: getEmotionColor(currentQuote.emotion) }}
              title={currentQuote.emotion}
            />
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-center mt-8 space-x-4">
          <button
            onClick={nextQuote}
            className="px-4 py-2 bg-background-primary/80 backdrop-blur rounded-lg text-body-small text-text-primary hover:bg-background-primary transition-all duration-200 border border-border-subtle"
          >
            다음 글귀 →
          </button>

          {/* 인디케이터 */}
          <div className="flex space-x-2">
            {sampleQuotes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentQuote(sampleQuotes[index]);
                    setIsAnimating(false);
                  }, 300);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  sampleQuotes.indexOf(currentQuote) === index
                    ? 'bg-interactive-primary'
                    : 'bg-border-strong hover:bg-interactive-primary/60',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
