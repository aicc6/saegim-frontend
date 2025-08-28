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
  const emotionColors: Record<string, string> = {
    행복: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    기쁨: 'bg-orange-100 border-orange-300 text-orange-800',
    사랑: 'bg-pink-100 border-pink-300 text-pink-800',
    감사: 'bg-green-100 border-green-300 text-green-800',
    평온: 'bg-blue-100 border-blue-300 text-blue-800',
    슬픔: 'bg-gray-100 border-gray-300 text-gray-800',
    화남: 'bg-red-100 border-red-300 text-red-800',
    걱정: 'bg-purple-100 border-purple-300 text-purple-800',
    스트레스: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    외로움: 'bg-slate-100 border-slate-300 text-slate-800',
    기타: 'bg-neutral-100 border-neutral-300 text-neutral-800',
  };

  return emotionColors[emotion] || emotionColors['기타'];
}

export function getEmotionEmoji(emotion: string): string {
  const emotionEmojis: Record<string, string> = {
    행복: '😊',
    기쁨: '😄',
    사랑: '❤️',
    감사: '🙏',
    평온: '😌',
    슬픔: '😢',
    화남: '😠',
    걱정: '😰',
    스트레스: '😵',
    외로움: '😔',
    기타: '🤔',
  };

  return emotionEmojis[emotion] || emotionEmojis['기타'];
}
