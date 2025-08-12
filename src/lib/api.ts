// API 클라이언트 기본 설정
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = {
  baseURL: API_BASE_URL,
};
