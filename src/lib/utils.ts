import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  let d: Date;

  if (typeof date === 'string') {
    // ISO 날짜 문자열(YYYY-MM-DD)을 로컬 시간대로 파싱
    const [year, month, day] = date.split('-').map(Number);
    d = new Date(year, month - 1, day); // month는 0-based
  } else {
    d = date;
  }

  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getEmotionColor(emotion: string): string {
  const colors = {
    happy: 'var(--emotion-happy)',
    sad: 'var(--emotion-sad)',
    angry: 'var(--emotion-angry)',
    peaceful: 'var(--emotion-peaceful)',
    unrest: 'var(--emotion-unrest)',
  };
  return colors[emotion as keyof typeof colors] || 'var(--text-secondary)';
}

export function getEmotionEmoji(emotion: string): string {
  const emojis = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    peaceful: '😌',
    unrest: '😨',
  };
  return emojis[emotion as keyof typeof emojis] || '😐';
}
