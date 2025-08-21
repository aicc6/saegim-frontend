// 공통 타입 정의
export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'peaceful'
  | 'worried'
  | 'unrest';

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  provider: 'google' | 'kakao' | 'naver' | 'email';
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  user_emotion?: EmotionType;
  ai_emotion?: EmotionType;
  ai_emotion_confidence?: number;
  ai_generated_text?: string;
  keywords?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
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
