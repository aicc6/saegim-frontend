/**
 * API 응답 타입 검증을 위한 타입 가드 함수들
 */

import { User } from '@/types';
import { DiaryEntry, DiaryListEntry } from '@/types/diary';

// 기본 타입 검증 유틸리티
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

// User 타입 가드
export function isValidUser(data: unknown): data is User {
  if (!isObject(data)) return false;

  return (
    isString(data.id) &&
    isString(data.email) &&
    isString(data.name) &&
    isString(data.createdAt) &&
    (data.provider === 'google' ||
      data.provider === 'kakao' ||
      data.provider === 'naver' ||
      data.provider === 'email') &&
    (data.profileImage === undefined || isString(data.profileImage))
  );
}

// DiaryEntry 타입 가드
export function isValidDiaryEntry(data: unknown): data is DiaryEntry {
  if (!isObject(data)) return false;

  const validEmotions = ['happy', 'sad', 'angry', 'peaceful', 'unrest'];

  return (
    isString(data.id) &&
    isString(data.title) &&
    isString(data.content) &&
    isBoolean(data.is_public) &&
    isString(data.created_at) &&
    isString(data.updated_at) &&
    (data.user_emotion === undefined ||
      validEmotions.includes(data.user_emotion as string)) &&
    (data.ai_emotion === undefined ||
      validEmotions.includes(data.ai_emotion as string)) &&
    (data.ai_emotion_confidence === undefined ||
      isNumber(data.ai_emotion_confidence)) &&
    (data.ai_generated_text === undefined ||
      isString(data.ai_generated_text)) &&
    (data.keywords === undefined || Array.isArray(data.keywords))
  );
}

// DiaryListEntry 타입 가드
export function isValidDiaryListEntry(data: unknown): data is DiaryListEntry {
  if (!isObject(data)) return false;

  const validEmotions = ['happy', 'sad', 'angry', 'peaceful', 'unrest'];

  return (
    isString(data.id) &&
    isString(data.title) &&
    isString(data.content) &&
    isBoolean(data.is_public) &&
    isString(data.created_at) &&
    isString(data.updated_at) &&
    (data.user_emotion === undefined ||
      validEmotions.includes(data.user_emotion as string)) &&
    (data.ai_emotion === undefined ||
      validEmotions.includes(data.ai_emotion as string))
  );
}

// 배열 타입 가드
export function isValidDiaryList(data: unknown): data is DiaryListEntry[] {
  return Array.isArray(data) && data.every(isValidDiaryListEntry);
}

// API 응답 검증 유틸리티
export function validateApiResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
): T {
  if (!validator(data)) {
    throw new Error('Invalid API response format');
  }
  return data;
}

// 안전한 JSON 파싱
export function safeJsonParse<T>(
  jsonString: string,
  validator: (data: unknown) => data is T,
): T | null {
  try {
    const parsed = JSON.parse(jsonString);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
