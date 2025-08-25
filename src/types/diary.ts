/**
 * 다이어리 관련 타입 정의
 */

export interface ImageInfo {
  id: string;
  file_path: string;
  thumbnail_path: string | null;
  mime_type: string | null;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  user_emotion: string | null;
  ai_emotion: string | null;
  ai_emotion_confidence: number | null;
  user_id: string;
  ai_generated_text: string | null;
  is_public: boolean;
  keywords: string[] | null; // keywords를 리스트 타입으로 수정
  created_at: string;
  updated_at: string | null;
  images?: ImageInfo[]; // 이미지 정보 추가
}

export interface DiaryListEntry {
  id: string;
  title: string;
  content: string; // 수정된 본문 내용을 표시하기 위해 content 필드 추가
  ai_generated_text: string | null; // ai_generated_text 필드 추가
  user_emotion: string | null;
  ai_emotion: string | null;
  created_at: string;
  is_public: boolean;
  keywords: string[] | null; // keywords를 리스트 타입으로 수정
  images?: ImageInfo[]; // 이미지 정보 추가
}

export interface DiaryFilters {
  page?: number;
  page_size?: number;
  searchTerm?: string;
  emotion?: string;
  is_public?: boolean;
  start_date?: string;
  end_date?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CalendarDateRange {
  startDate: string;
  endDate: string;
}

// 감정 타입 (프론트엔드에서 사용) - worried를 unrest로 통일
export type EmotionType = 'happy' | 'sad' | 'angry' | 'peaceful' | 'unrest';

// 감정별 색상 매핑 - 사용자 지정 색상으로 변경
export const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: 'bg-yellow-100 text-yellow-800 border-yellow-200', // Soft Gold (#E6C55A)
  sad: 'bg-blue-100 text-blue-800 border-blue-200', // Calm Blue (#6B8AC7)
  angry: 'bg-orange-100 text-orange-800 border-orange-200', // Warm Orange (#D67D5C)
  peaceful: 'bg-green-100 text-green-800 border-green-200', // Natural Green (#7DB87D)
  unrest: 'bg-purple-100 text-purple-800 border-purple-200', // Deep Purple (#8B5A96)
};

// 감정별 이모지 - worried를 unrest로 통일
export const EMOTION_EMOJIS: Record<EmotionType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  peaceful: '😌',
  unrest: '😰',
};

// 차트용 키워드 타입
export interface KeywordData {
  word: string;
  count: number;
}
