'use client';

import { useMemo, memo } from 'react';
import { EmotionType, EMOTION_EMOJIS } from '@/types/diary';
import { cn } from '@/lib/utils';

interface EmotionPieChartProps {
  data: Record<EmotionType, number>;
  className?: string;
}

// 감정별 실제 색상 코드 정의
const EMOTION_CHART_COLORS: Record<EmotionType, string> = {
  happy: '#E6C55A', // Soft Gold
  sad: '#6B8AC7', // Calm Blue
  angry: '#D67D5C', // Warm Orange
  peaceful: '#7DB87D', // Natural Green
  unrest: '#8B5A96', // Deep Purple (진한 보라색)
};

const emotionLabels = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  peaceful: '평온',
  unrest: '불안', // worried와 excited를 unrest로 통일
};

export const EmotionPieChart = memo(function EmotionPieChart({
  data,
  className,
}: EmotionPieChartProps) {
  const chartData = useMemo(() => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return [];
    }

    const validEmotions = Object.entries(data).filter(
      ([_, count]) => count > 0,
    );

    // 한 개의 감정만 있을 때는 전체 원(360도)을 그리기
    if (validEmotions.length === 1) {
      const [emotion, count] = validEmotions[0];
      return [
        {
          emotion: emotion as EmotionType,
          count,
          percentage: 100,
          startAngle: 0,
          endAngle: 359.99, // 360도는 SVG에서 문제가 될 수 있으므로 359.99로 설정
          color: EMOTION_CHART_COLORS[emotion as EmotionType],
        },
      ];
    }

    // 여러 감정이 있을 때는 비례적으로 분할
    let cumulativePercentage = 0;

    return validEmotions.map(([emotion, count]) => {
      const percentage = (count / total) * 100;
      const startAngle = cumulativePercentage * 3.6; // 360도를 100으로 나눈 값
      const endAngle = (cumulativePercentage + percentage) * 3.6;

      cumulativePercentage += percentage;

      return {
        emotion: emotion as EmotionType,
        count,
        percentage,
        startAngle,
        endAngle,
        color: EMOTION_CHART_COLORS[emotion as EmotionType],
      };
    });
  }, [data]);

  const total = useMemo(
    () => Object.values(data).reduce((sum, count) => sum + count, 0),
    [data],
  );

  // 감정 데이터가 있는지 확인 (0이 아닌 감정이 있는지)
  const hasEmotionData = useMemo(
    () => Object.values(data).some((count) => count > 0),
    [data],
  );

  if (!hasEmotionData) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-text-secondary">아직 감정 기록이 없습니다</p>
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
      <h3 className="text-h4 font-bold text-text-primary mb-4">감정 분포</h3>

      <div className="flex items-center justify-between">
        {/* 차트 */}
        <div className="relative flex-1 flex justify-center">
          {/* CSS 기반 원형 차트 */}
          <div className="relative w-[200px] h-[200px]">
            {chartData.map((item) => {
              const isFullCircle =
                item.startAngle === 0 && item.endAngle >= 359;
              const rotation = item.startAngle;
              return (
                <div
                  key={item.emotion}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isFullCircle
                      ? `conic-gradient(from ${rotation}deg, ${item.color} 0deg, ${item.color} 360deg)`
                      : `conic-gradient(from ${rotation}deg, ${item.color} 0deg, ${item.color} ${item.percentage * 3.6}deg, transparent ${item.percentage * 3.6}deg)`,
                    mask: 'radial-gradient(circle, transparent 32px, black 32px)',
                    WebkitMask:
                      'radial-gradient(circle, transparent 32px, black 32px)',
                  }}
                />
              );
            })}

            {/* 중앙 원 - 크기 축소 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-background-primary rounded-full border-2 border-border-subtle flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">
                    {total}
                  </div>
                  <div className="text-xs text-text-secondary">총 기록</div>
                </div>
              </div>
            </div>

            {/* 모바일용 이모티콘 표시 (760px 미만에서만) */}
            <div className="absolute inset-0 md:hidden">
              {chartData.map((item, index) => {
                // 각 섹션의 중앙 각도 계산
                const midAngle = (item.startAngle + item.endAngle) / 2;
                const radians = (midAngle * Math.PI) / 180;

                // 차트 중심에서 70px 떨어진 위치에 이모티콘 배치 (배경색의 중앙쯤 위치)
                const radius = 65;
                const x = 100 + radius * Math.cos(radians - Math.PI / 2); // -90도 회전하여 12시 방향부터 시작
                const y = 100 + radius * Math.sin(radians - Math.PI / 2);

                return (
                  <div
                    key={item.emotion}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold">
                        {EMOTION_EMOJIS[item.emotion]}
                      </div>
                      <div className="text-xs font-bold text-white drop-shadow-lg">
                        {item.percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-2 ml-4 hidden md:block 2xl:space-y-3 2xl:ml-6">
          {Object.entries(emotionLabels).map(([emotion, label]) => {
            const count = data[emotion as EmotionType] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const color = EMOTION_CHART_COLORS[emotion as EmotionType];

            return (
              <div
                key={emotion}
                className="flex items-center space-x-2 2xl:space-x-3"
              >
                <div className="flex items-center space-x-1 2xl:space-x-2">
                  <div
                    className="w-3 h-3 2xl:w-4 2xl:h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-base 2xl:text-xl">
                    {EMOTION_EMOJIS[emotion as EmotionType]}
                  </span>
                </div>

                {/* 텍스트는 770px~1279px(md부터 xl까지)와 1536px 이상(2xl)에서 표시 */}
                <div className="flex-1 hidden md:block xl:hidden 2xl:block">
                  <div className="flex items-center justify-between">
                    <span className="text-body 2xl:text-body text-body-small text-text-primary">
                      {label}
                    </span>
                    <span className="text-body-small 2xl:text-body-small text-caption text-text-secondary">
                      {count}개
                    </span>
                  </div>
                  <div className="text-caption 2xl:text-caption text-caption text-text-secondary">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
