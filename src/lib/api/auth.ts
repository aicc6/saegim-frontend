/**
 * 인증 관련 API
 */

import { apiClient, API_BASE_URL } from './client';

export interface LoginResponse {
  user_id: string;
  email: string;
  nickname: string;
  message: string;
  // 쿠키 기반 인증이므로 토큰은 응답에 포함되지 않음
}

export interface PasswordResetEmailResponse {
  success: boolean;
  message: string;
  is_social_account?: boolean;
  email_sent?: boolean;
  redirect_to_error_page?: boolean;
}

// 인증 관련 API 엔드포인트
export const authApi = {
  // 구글 로그인 시작 (백엔드로 리다이렉트)
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  },

  // 로그아웃
  logout: async () => {
    try {
      // 백엔드에 로그아웃 요청 (쿠키 기반 세션 정리)
      await apiClient.post('/api/auth/logout', {});

      // 쿠키가 자동으로 삭제되므로 localStorage 정리 불필요
      return { success: true };
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출이 실패해도 쿠키는 자동으로 정리됨
      return { success: true };
    }
  },

  // 회원가입
  signup: async (data: {
    email: string;
    password: string;
    nickname: string;
  }) => {
    return apiClient.post('/api/auth/signup', data);
  },

  // 이메일 중복 확인
  checkEmail: async (email: string) => {
    return apiClient.get(`/api/auth/check-email/${email}`);
  },

  // 닉네임 중복 확인
  checkNickname: async (nickname: string) => {
    return apiClient.get(`/api/auth/check-nickname/${nickname}`);
  },

  // 이메일 로그인
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      data,
    );

    // 쿠키에 토큰이 자동으로 설정되므로 localStorage 저장 불필요
    return response;
  },

  // 이메일 인증 코드 발송
  sendVerificationEmail: async (data: { email: string }) => {
    return apiClient.post('/api/auth/send-verification-email', data);
  },

  // 이메일 인증 코드 확인
  verifyEmail: async (data: { email: string; verification_code: string }) => {
    return apiClient.post('/api/auth/verify-email', data);
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    return apiClient.get('/api/auth/me');
  },

  // 비밀번호 재설정 이메일 발송
  sendPasswordResetEmail: async (data: { email: string }) => {
    return apiClient.post<PasswordResetEmailResponse>(
      '/api/auth/forgot-password',
      data,
    );
  },

  // 비밀번호 재설정 인증코드 확인
  verifyPasswordResetCode: async (data: {
    email: string;
    verification_code: string;
  }) => {
    return apiClient.post('/api/auth/forgot-password/verify', data);
  },

  // 비밀번호 재설정
  resetPassword: async (data: {
    email: string;
    verification_code: string;
    new_password: string;
  }) => {
    return apiClient.post('/api/auth/forgot-password/reset', data);
  },

  // 계정 복구 이메일 발송
  sendRestoreEmail: async (email: string) => {
    return apiClient.post('/api/auth/restore/send-restore-email', { email });
  },

  // 계정 복구
  restoreAccount: async (data: {
    email: string;
    verification_code: string;
  }) => {
    return apiClient.post('/api/auth/restore', data);
  },
};
