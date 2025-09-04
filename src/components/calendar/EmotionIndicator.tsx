import { useState, useEffect } from 'react';
import { EmotionType, EMOTION_COLORS, EMOTION_EMOJIS } from '@/types/diary';
import { cn } from '@/lib/utils';

interface EmotionIndicatorProps {
  emotion: EmotionType | null;
  keywords: string[];
  isCurrentMonth: boolean;
  isSelected: boolean;
}

export const EmotionIndicator = ({
  emotion,
  keywords,
  isCurrentMonth,
  isSelected: _isSelected,
}: EmotionIndicatorProps) => {
  const [showKeywords, setShowKeywords] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // 더 넓은 화면에서만 키워드 표시 (1200px 이상)
      setShowKeywords(window.innerWidth > 1200);
    };

    // 초기 체크
    checkScreenSize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', checkScreenSize);

    // 클린업
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!emotion && (!keywords || keywords.length === 0)) return null;

  const getKeywordBackgroundColor = (emotion: EmotionType | null) => {
    if (!emotion) return 'rgba(0,0,0,0.1)';

    const colorMap = {
      happy: '#FEF3C7', // bg-yellow-100
      sad: '#DBEAFE', // bg-blue-100
      angry: '#FFEDD5', // bg-orange-100
      peaceful: '#DCFCE7', // bg-green-100
      unrest: '#F3E8FF', // bg-purple-100
    };

    return colorMap[emotion] || 'rgba(0,0,0,0.1)';
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="flex flex-col items-center gap-0.5 px-1 pb-1">
        {emotion && (
          <div
            className={cn(
              'rounded-full flex items-center justify-center',
              EMOTION_COLORS[emotion],
            )}
            style={{
              width: 'calc(clamp(40px, 8vw, 90px) / 3)',
              height: 'calc(clamp(40px, 8vw, 90px) / 3)',
              minWidth: '13px',
              minHeight: '13px',
              fontSize: 'calc(clamp(40px, 8vw, 90px) / 3 * 0.6)',
            }}
          >
            {EMOTION_EMOJIS[emotion]}
          </div>
        )}

        {keywords && keywords.length > 0 && showKeywords && (
          <div className="flex items-center justify-center gap-0.5 w-full">
            {keywords.slice(0, 2).map((keyword: string, index: number) => {
              // 글자수에 따른 크기 계산 (최소 8px, 글자당 2px씩 증가, 최대 20px)
              const paddingX = Math.min(Math.max(8, keyword.length * 2), 20);

              return (
                <span
                  key={index}
                  className={cn(
                    'text-[10px] py-0.5 rounded font-medium truncate text-center',
                    isCurrentMonth ? 'font-medium' : 'font-normal',
                  )}
                  style={{
                    fontSize: '10px',
                    lineHeight: '1.1',
                    backgroundColor: getKeywordBackgroundColor(emotion),
                    color: '#000000', // 다크모드에서도 잘 보이도록 검은색으로 고정
                    paddingLeft: `${paddingX}px`,
                    paddingRight: `${paddingX}px`,
                    minWidth: `${Math.max(20, keyword.length * 8)}px`, // 글자수에 따른 최소 너비
                  }}
                  title={keyword} // 호버 시 전체 키워드 표시
                >
                  #{keyword}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
