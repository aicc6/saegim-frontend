'use client';

import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, Copy, Save, AlertCircle, Clock } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface EnhancedToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
  icon?: React.ReactNode;
}

/**
 * 개선된 토스트 시스템 - Sonner 기반
 * 일관된 디자인과 풍부한 사용자 피드백 제공
 */
export class EnhancedToast {
  /**
   * 다이어리 저장 성공 토스트
   */
  static diarySaved(
    options: {
      onViewDiary?: () => void;
      duration?: number;
    } = {},
  ) {
    return toast.success('다이어리가 저장되었습니다! 🎉', {
      description: '생성된 글이 성공적으로 저장되었습니다.',
      duration: options.duration || 5000,
      icon: <Save className="w-4 h-4 text-emerald-600" />,
      action: options.onViewDiary
        ? {
            label: '다이어리 보기',
            onClick: options.onViewDiary,
          }
        : undefined,
      className: 'saegim-toast-success',
    });
  }

  /**
   * 다이어리 저장 중 로딩 토스트
   */
  static diarySaving() {
    return toast.loading('다이어리를 저장하고 있습니다...', {
      description: '잠시만 기다려주세요.',
      icon: <Clock className="w-4 h-4 text-sage-60 animate-spin" />,
      className: 'saegim-toast-loading',
    });
  }

  /**
   * 클립보드 복사 성공 토스트
   */
  static clipboardCopied(
    options: {
      text?: string;
      duration?: number;
    } = {},
  ) {
    return toast.success('클립보드에 복사되었습니다! 📋', {
      description: options.text
        ? `"${options.text.slice(0, 30)}${options.text.length > 30 ? '...' : ''}"이(가) 복사되었습니다.`
        : '텍스트가 클립보드에 성공적으로 복사되었습니다.',
      duration: options.duration || 3000,
      icon: <Copy className="w-4 h-4 text-blue-600" />,
      className: 'saegim-toast-success',
    });
  }

  /**
   * 에러 토스트
   */
  static error(message: string, options: EnhancedToastOptions = {}) {
    return toast.error(message, {
      description: options.description,
      duration: options.duration || 4000,
      icon: options.icon || <AlertCircle className="w-4 h-4 text-red-600" />,
      action: options.action,
      className: 'saegim-toast-error',
    });
  }

  /**
   * 성공 토스트
   */
  static success(message: string, options: EnhancedToastOptions = {}) {
    return toast.success(message, {
      description: options.description,
      duration: options.duration || 3000,
      icon: options.icon || (
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      ),
      action: options.action,
      className: 'saegim-toast-success',
    });
  }

  /**
   * 정보 토스트
   */
  static info(message: string, options: EnhancedToastOptions = {}) {
    return toast.info(message, {
      description: options.description,
      duration: options.duration || 3000,
      icon: options.icon,
      action: options.action,
      className: 'saegim-toast-info',
    });
  }

  /**
   * 기존 토스트 업데이트
   */
  static update(
    toastId: string | number,
    message: string,
    type: 'success' | 'error' | 'info',
    options: EnhancedToastOptions = {},
  ) {
    const updateFunction =
      type === 'success'
        ? toast.success
        : type === 'error'
          ? toast.error
          : toast.info;

    return updateFunction(message, {
      id: toastId,
      description: options.description,
      duration: options.duration || 3000,
      icon: options.icon,
      action: options.action,
      className: `saegim-toast-${type}`,
    });
  }
}

// 편의를 위한 단축 함수들
export const enhancedToast = {
  diarySaved: EnhancedToast.diarySaved,
  diarySaving: EnhancedToast.diarySaving,
  clipboardCopied: EnhancedToast.clipboardCopied,
  success: EnhancedToast.success,
  error: EnhancedToast.error,
  info: EnhancedToast.info,
  update: EnhancedToast.update,
};
