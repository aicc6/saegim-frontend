/**
 * 인증 관련 Zod 스키마 정의
 * React Hook Form과 함께 사용하여 타입 안전성과 검증 로직을 통합
 */

import type { TFunction } from 'i18next';
import { z } from 'zod';
import { VALIDATION } from '@/constants';

type Translator = TFunction;

const createEmailSchema = (t: Translator) =>
  z
    .string()
    .min(1, t('auth.validation.email.required'))
    .email(t('auth.validation.email.invalid'));

const createPasswordSchema = (t: Translator) =>
  z
    .string()
    .min(1, t('auth.validation.password.required'))
    .min(9, t('auth.validation.password.min', { count: 9 }))
    .max(15, t('auth.validation.password.max', { count: 15 }))
    .regex(/[a-zA-Z]/, t('auth.validation.password.mustIncludeLetter'))
    .regex(/\d/, t('auth.validation.password.mustIncludeNumber'))
    .regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      t('auth.validation.password.mustIncludeSymbol'),
    );

const createNicknameSchema = (t: Translator) =>
  z
    .string()
    .min(1, t('auth.validation.nickname.required'))
    .min(
      VALIDATION.NICKNAME_MIN_LENGTH,
      t('auth.validation.nickname.min', {
        count: VALIDATION.NICKNAME_MIN_LENGTH,
      }),
    )
    .max(
      VALIDATION.NICKNAME_MAX_LENGTH,
      t('auth.validation.nickname.max', {
        count: VALIDATION.NICKNAME_MAX_LENGTH,
      }),
    )
    .regex(/^[가-힣a-zA-Z]+$/, t('auth.validation.nickname.pattern'));

const createVerificationCodeSchema = (t: Translator) =>
  z
    .string()
    .min(1, t('auth.validation.verification.required'))
    .length(
      VALIDATION.VERIFICATION_CODE_LENGTH,
      t('auth.validation.verification.length', {
        count: VALIDATION.VERIFICATION_CODE_LENGTH,
      }),
    )
    .regex(/^\d+$/, t('auth.validation.verification.numeric'));

export const createLoginSchema = (t: Translator) =>
  z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t('auth.validation.password.required')),
  });

export const createSignupSchema = (t: Translator) =>
  z
    .object({
      nickname: createNicknameSchema(t),
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      passwordConfirm: z
        .string()
        .min(1, t('auth.validation.password.confirmRequired')),
      verificationCode: createVerificationCodeSchema(t).optional(),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('auth.validation.password.mismatch'),
      path: ['passwordConfirm'],
    });

export const createForgotPasswordSchema = (t: Translator) =>
  z.object({
    email: createEmailSchema(t),
  });

export const createResetPasswordSchema = (t: Translator) =>
  z
    .object({
      password: createPasswordSchema(t),
      passwordConfirm: z
        .string()
        .min(1, t('auth.validation.password.confirmRequired')),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('auth.validation.password.mismatch'),
      path: ['passwordConfirm'],
    });

export const createChangePasswordSchema = (t: Translator) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, t('auth.validation.password.currentRequired')),
      newPassword: createPasswordSchema(t),
      newPasswordConfirm: z
        .string()
        .min(1, t('auth.validation.password.newConfirmRequired')),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
      message: t('auth.validation.password.newMismatch'),
      path: ['newPasswordConfirm'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t('auth.validation.password.newMustDiffer'),
      path: ['newPassword'],
    });

export const createChangeEmailSchema = (t: Translator) =>
  z.object({
    currentPassword: z
      .string()
      .min(1, t('auth.validation.password.currentRequired')),
    newEmail: createEmailSchema(t),
    nickname: createNicknameSchema(t),
  });

export const createSupportSchema = (t: Translator) =>
  z.object({
    title: z
      .string()
      .min(1, t('auth.validation.support.titleRequired'))
      .min(3, t('auth.validation.support.titleMin', { count: 3 }))
      .max(100, t('auth.validation.support.titleMax', { count: 100 })),
    content: z
      .string()
      .min(1, t('auth.validation.support.contentRequired'))
      .min(10, t('auth.validation.support.contentMin', { count: 10 }))
      .max(1000, t('auth.validation.support.contentMax', { count: 1000 })),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;
export type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
export type ChangePasswordFormData = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
export type ChangeEmailFormData = z.infer<
  ReturnType<typeof createChangeEmailSchema>
>;
export type SupportFormData = z.infer<ReturnType<typeof createSupportSchema>>;

/**
 * 기본 필드 스키마들
 */
