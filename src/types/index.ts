// 공통 타입 정의
import type { EmotionType } from './diary';

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  profileImage?: string;
  provider: 'google' | 'kakao' | 'naver' | 'email';
  createdAt: string;
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

// 인증 관련 에러 타입
export type AuthErrorType =
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_PERMANENTLY_DELETED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  detail?: string | Record<string, unknown>;
  recoverable?: boolean;
  action?: 'REDIRECT_LOGIN' | 'REDIRECT_RESTORE' | 'SHOW_ERROR' | 'RETRY';
}

// 계정 삭제 관련 타입
export interface AccountDeletionInfo {
  error: 'ACCOUNT_DELETED' | 'ACCOUNT_PERMANENTLY_DELETED';
  restore_available: boolean;
  days_remaining?: number;
  deleted_at?: string;
}

// 폼 유효성 검사 타입
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// 비밀번호 강도 타입
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordValidation {
  isValid: boolean;
  strength: PasswordStrength;
  errors: string[];
  score: number; // 0-100
}
