'use client';

import { useMemo } from 'react';
import { cn, getEmotionColor } from '@/lib/utils';
import { EmotionType } from '@/types';

interface KeywordBarChartProps {
  data: { word: string; count: number; emotion: EmotionType }[];
  className?: string;
}

export function KeywordBarChart({ data, className }: KeywordBarChartProps) {
  const chartData = useMemo(() => {
    const maxCount = Math.max(...data.map((item) => item.count));

    return data.slice(0, 10).map((item) => ({
      ...item,
      percentage: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
    }));
  }, [data]);

  const totalKeywords = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-text-secondary">아직 키워드가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background-primary rounded-lg border border-border-subtle p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h4 font-bold text-text-primary">주요 키워드</h3>
        <span className="text-body-small text-text-secondary">
          총 {totalKeywords}개
        </span>
      </div>

      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={item.word} className="flex items-center space-x-3">
            {/* 순위 */}
            <div className="w-6 text-center">
              <span
                className={cn(
                  'text-body-small font-bold',
                  index < 3
                    ? 'text-interactive-primary'
                    : 'text-text-secondary',
                )}
              >
                {index + 1}
              </span>
            </div>

            {/* 키워드 */}
            <div className="w-16 text-left">
              <span className="text-body text-text-primary font-medium">
                {item.word}
              </span>
            </div>

            {/* 바 차트 */}
            <div className="flex-1 relative">
              <div className="w-full h-6 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: getEmotionColor(item.emotion),
                  }}
                />
              </div>

              {/* 값 표시 */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="text-caption text-text-secondary">
                  {item.count}개
                </span>
              </div>
            </div>

            {/* 비율 */}
            <div className="w-12 text-right">
              <span className="text-body-small text-text-secondary">
                {((item.count / totalKeywords) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 추가 키워드가 있는 경우 */}
      {data.length > 10 && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-caption text-text-secondary text-center">
            +{data.length - 10}개의 추가 키워드
          </p>
        </div>
      )}
    </div>
  );
}
