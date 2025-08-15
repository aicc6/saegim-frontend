import { ButtonHTMLAttributes } from 'react';
import { EmotionType } from '@/types';
import { cn, getEmotionColor, getEmotionEmoji } from '@/lib/utils';

interface EmotionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emotion: EmotionType;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const emotionLabels = {
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  peaceful: '평온',
  unrest: '불안',
};

export function EmotionButton({
  emotion,
  selected = false,
  size = 'md',
  className,
  ...props
}: EmotionButtonProps) {
  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <button
      className={cn(
        'emotion-button flex flex-col items-center justify-center rounded-full border-2 transition-all duration-300 hover:shadow-emotion-hover',
        sizes[size],
        selected
          ? 'border-interactive-primary shadow-emotion'
          : 'border-transparent hover:border-border-subtle',
        className,
      )}
      style={{
        backgroundColor: selected
          ? `${getEmotionColor(emotion)}20`
          : 'var(--background-secondary)',
      }}
      {...props}
    >
      <span className="mb-1">{getEmotionEmoji(emotion)}</span>
      <span className="text-caption text-text-secondary">
        {emotionLabels[emotion]}
      </span>
    </button>
  );
}
