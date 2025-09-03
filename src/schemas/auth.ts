/**
 * 인증 관련 Zod 스키마 정의
 * React Hook Form과 함께 사용하여 타입 안전성과 검증 로직을 통합
 */

import { z } from 'zod';
import { VALIDATION } from '@/constants';

/**
 * 기본 필드 스키마들
 */
export const emailSchema = z
  .string()
  .min(1, '이메일을 입력해주세요.')
  .email('올바른 이메일 형식을 입력해주세요.');

export const passwordSchema = z
  .string()
  .min(1, '비밀번호를 입력해주세요.')
  .min(9, '비밀번호는 9자 이상이어야 합니다.')
  .max(15, '비밀번호는 15자 이하여야 합니다.')
  .regex(/[a-zA-Z]/, '비밀번호는 영문을 포함해야 합니다.')
  .regex(/\d/, '비밀번호는 숫자를 포함해야 합니다.')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    '비밀번호는 특수문자를 포함해야 합니다.',
  );

export const nicknameSchema = z
  .string()
  .min(1, '닉네임을 입력해주세요.')
  .min(
    VALIDATION.NICKNAME_MIN_LENGTH,
    `닉네임은 ${VALIDATION.NICKNAME_MIN_LENGTH}자 이상이어야 합니다.`,
  )
  .max(
    VALIDATION.NICKNAME_MAX_LENGTH,
    `닉네임은 ${VALIDATION.NICKNAME_MAX_LENGTH}자 이하여야 합니다.`,
  )
  .regex(/^[가-힣a-zA-Z\s]+$/, '닉네임은 한글과 영문만 사용 가능합니다.');

export const verificationCodeSchema = z
  .string()
  .min(1, '인증 코드를 입력해주세요.')
  .length(
    VALIDATION.VERIFICATION_CODE_LENGTH,
    `인증 코드는 ${VALIDATION.VERIFICATION_CODE_LENGTH}자리 숫자입니다.`,
  )
  .regex(/^\d+$/, '인증 코드는 숫자만 입력 가능합니다.');

/**
 * 폼별 스키마 정의
 */

// 로그인 폼 스키마
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

// 회원가입 폼 스키마
export const signupSchema = z
  .object({
    nickname: nicknameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    verificationCode: verificationCodeSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '입력한 비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

// 비밀번호 찾기 폼 스키마
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// 비밀번호 재설정 폼 스키마
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '입력한 비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

// 비밀번호 변경 폼 스키마
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: passwordSchema,
    newPasswordConfirm: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  });

// 이메일 변경 폼 스키마
export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newEmail: emailSchema,
  nickname: nicknameSchema,
});

// 지원/문의 폼 스키마
export const supportSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .min(3, '제목은 3자 이상이어야 합니다.')
    .max(100, '제목은 100자 이하여야 합니다.'),
  content: z
    .string()
    .min(1, '내용을 입력해주세요.')
    .min(10, '내용은 10자 이상이어야 합니다.')
    .max(1000, '내용은 1000자 이하여야 합니다.'),
});

/**
 * 타입 추론
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;
export type SupportFormData = z.infer<typeof supportSchema>;
