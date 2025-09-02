import { type ClassValue, clsx } from 'clsx';
import { LOCALES } from '@/constants/locale';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 날짜/시간 포맷 옵션 타입
export interface DateTimeFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
  timeFormat?: '12h' | '24h';
  locale?: string;
}

export interface RelativeTimeOptions {
  maxDays?: number; // 며칠까지 상대시간으로 표시할지 (기본: 7일)
  locale?: string;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);

  // Invalid Date 체크
  if (isNaN(d.getTime())) {
    return '날짜 정보 없음';
  }

  return d.toLocaleDateString(LOCALES.KOREAN, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);

  // Invalid Date 체크
  if (isNaN(d.getTime())) {
    return '시간 정보 없음';
  }

  return d.toLocaleTimeString(LOCALES.KOREAN, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 상대 시간으로 날짜를 포맷팅합니다 (예: "방금 전", "3분 전", "어제")
 */
export function formatRelativeTime(
  date: string | Date,
  baseDate: Date = new Date(),
  options: RelativeTimeOptions = {},
): string {
  const { maxDays = 7 } = options;
  const targetDate = new Date(date);
  const now = baseDate;

  // Invalid Date 체크
  if (isNaN(targetDate.getTime()) || isNaN(now.getTime())) {
    return '날짜 정보 없음';
  }

  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 미래 날짜인 경우
  if (diffMs < 0) {
    return formatDate(targetDate);
  }

  // 1분 미만
  if (diffMinutes < 1) {
    return '방금 전';
  }

  // 1시간 미만
  if (diffHours < 1) {
    return `${diffMinutes}분 전`;
  }

  // 1일 미만
  if (diffDays < 1) {
    return `${diffHours}시간 전`;
  }

  // 어제
  if (diffDays === 1) {
    return '어제';
  }

  // 설정된 최대 일수 미만
  if (diffDays < maxDays) {
    return `${diffDays}일 전`;
  }

  // 그 외에는 절대 날짜
  return formatDate(targetDate);
}

/**
 * 날짜와 시간을 함께 포맷팅합니다
 */
export function formatDateTime(
  date: string | Date,
  options: DateTimeFormatOptions = {},
): string {
  const {
    format = 'medium',
    includeTime = true,
    timeFormat = '24h',
    locale = LOCALES.KOREAN,
  } = options;
  const d = new Date(date);

  // Invalid Date 체크
  if (isNaN(d.getTime())) {
    return '날짜 정보 없음';
  }

  let dateOptions: Intl.DateTimeFormatOptions = {};
  let timeOptions: Intl.DateTimeFormatOptions = {};

  // 날짜 포맷 설정
  switch (format) {
    case 'short':
      dateOptions = { year: '2-digit', month: '2-digit', day: '2-digit' };
      break;
    case 'medium':
      dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      break;
    case 'long':
      dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      break;
    case 'full':
      dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      };
      break;
  }

  // 시간 포맷 설정
  if (includeTime) {
    timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12h',
    };
  }

  const dateStr = d.toLocaleDateString(locale, dateOptions);

  if (!includeTime) {
    return dateStr;
  }

  const timeStr = d.toLocaleTimeString(locale, timeOptions);
  return `${dateStr} ${timeStr}`;
}

/**
 * 날짜가 오늘인지 확인합니다
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * 날짜가 어제인지 확인합니다
 */
export function isYesterday(date: string | Date): boolean {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * 날짜가 이번 주인지 확인합니다
 */
export function isThisWeek(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();

  // 주의 시작을 일요일로 설정
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return d >= weekStart && d <= weekEnd;
}

/**
 * 두 날짜 사이의 시간 차이를 구합니다
 */
export function getTimeAgo(
  date: string | Date,
  baseDate: Date = new Date(),
): {
  value: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
} {
  const d = new Date(date);
  const diffMs = baseDate.getTime() - d.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return { value: diffYears, unit: 'year' };
  if (diffMonths > 0) return { value: diffMonths, unit: 'month' };
  if (diffWeeks > 0) return { value: diffWeeks, unit: 'week' };
  if (diffDays > 0) return { value: diffDays, unit: 'day' };
  if (diffHours > 0) return { value: diffHours, unit: 'hour' };
  if (diffMinutes > 0) return { value: diffMinutes, unit: 'minute' };
  return { value: diffSeconds, unit: 'second' };
}

/**
 * 날짜에 일수를 더합니다
 */
export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * 날짜에 월수를 더합니다
 */
export function addMonths(date: string | Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * 날짜를 YYYY-MM-DD 형태 문자열로 변환합니다
 */
export function toDateString(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
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
    걱정: '😨',
    스트레스: '😵',
    외로움: '😔',
    기타: '🤔',
  };

  return emotionEmojis[emotion] || emotionEmojis['기타'];
}
