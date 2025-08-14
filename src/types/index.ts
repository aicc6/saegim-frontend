// 공통 타입 정의
export type EmotionType = 'happy' | 'sad' | 'angry' | 'peaceful' | 'unrest';

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  provider: 'google' | 'kakao' | 'naver';
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  userEmotion?: EmotionType;
  aiEmotion?: EmotionType;
  aiEmotionConfidence?: number;
  aiGeneratedText?: string;
  images: string[];
  keywords?: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIStyle {
  tone: 'romantic' | 'healing' | 'calm' | 'humorous';
  length: 'short' | 'medium' | 'long';
  type: 'poem' | 'prose' | 'diary';
}

export interface Notification {
  id: string;
  type: 'diary_reminder' | 'report_ready' | 'ai_complete';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  emotionDistribution: Record<EmotionType, number>;
  keywordCloud: { word: string; count: number }[];
  totalEntries: number;
  mostCommonEmotion: EmotionType;
  summary: string;
}

export interface CalendarDay {
  date: string;
  entries: DiaryEntry[];
  dominantEmotion?: EmotionType;
  hasEntries: boolean;
}
