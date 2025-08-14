'use client';

import { useMemo } from 'react';
import { EmotionType } from '@/types';
import { getEmotionColor, getEmotionEmoji, cn } from '@/lib/utils';

interface EmotionPieChartProps {
  data: Record<EmotionType, number>;
  className?: string;
}

const emotionLabels = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  peaceful: '평온',
  unrest: '불안',
};

export function EmotionPieChart({ data, className }: EmotionPieChartProps) {
  const chartData = useMemo(() => {
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return [];
    }

    let cumulativePercentage = 0;

    return Object.entries(data)
      .filter(([_, count]) => count > 0)
      .map(([emotion, count]) => {
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
          color: getEmotionColor(emotion),
        };
      });
  }, [data]);

  const total = useMemo(
    () => Object.values(data).reduce((sum, count) => sum + count, 0),
    [data],
  );

  // SVG 경로 생성 함수
  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      centerX,
      centerY,
      'L',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  if (total === 0) {
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
          <svg width="200" height="200" className="transform -rotate-90">
            {chartData.map((item) => (
              <path
                key={item.emotion}
                d={createArcPath(100, 100, 100, item.startAngle, item.endAngle)}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}

            {/* 중앙 원 */}
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="var(--background-primary)"
              stroke="var(--border-subtle)"
              strokeWidth="2"
            />

            {/* 차트 안 감정 라벨 (작은 화면에서만) */}
            {chartData.map((item) => {
              const midAngle = (item.startAngle + item.endAngle) / 2;
              const labelRadius = 70; // 중심원(40)과 외곽(100) 사이의 중간
              const labelPos = polarToCartesian(
                100,
                100,
                labelRadius,
                midAngle,
              );

              return (
                <text
                  key={`label-${item.emotion}`}
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="block md:hidden fill-current text-text-primary"
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transform: `rotate(90deg)`,
                    transformOrigin: `${labelPos.x}px ${labelPos.y}px`,
                  }}
                >
                  {getEmotionEmoji(item.emotion)}
                </text>
              );
            })}
          </svg>

          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-h3 font-bold text-text-primary">{total}</div>
              <div className="text-caption text-text-secondary">총 기록</div>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-3 ml-6 hidden md:block 2xl:space-y-3 2xl:ml-6 space-y-2 ml-4">
          {Object.entries(emotionLabels).map(([emotion, label]) => {
            const count = data[emotion as EmotionType] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const color = getEmotionColor(emotion);

            return (
              <div
                key={emotion}
                className="flex items-center space-x-3 2xl:space-x-3 space-x-2"
              >
                <div className="flex items-center space-x-2 2xl:space-x-2 space-x-1">
                  <div
                    className="w-4 h-4 2xl:w-4 2xl:h-4 w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xl 2xl:text-xl text-base">
                    {getEmotionEmoji(emotion)}
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
}
