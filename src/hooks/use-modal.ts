'use client';

import { create } from 'zustand';
import { ReactNode } from 'react';

interface ModalState {
  // Alert modal
  alertModal: {
    open: boolean;
    title: string;
    message: string | ReactNode;
    type: 'info' | 'success' | 'warning' | 'error';
    confirmText: string;
    onConfirm: () => void;
  };

  // Confirm modal
  confirmModal: {
    open: boolean;
    title: string;
    message: string | ReactNode;
    type: 'warning' | 'danger';
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
  };

  // Actions
  showAlert: (options: {
    title: string;
    message: string | ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error';
    confirmText?: string;
    onConfirm?: () => void;
  }) => void;

  showConfirm: (options: {
    title: string;
    message: string | ReactNode;
    type?: 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => Promise<boolean>;

  closeAlert: () => void;
  closeConfirm: () => void;
  setConfirmLoading: (loading: boolean) => void;
}

export const useModal = create<ModalState>((set, _get) => ({
  alertModal: {
    open: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '확인',
    onConfirm: () => {},
  },

  confirmModal: {
    open: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: '확인',
    cancelText: '취소',
    onConfirm: () => {},
    onCancel: () => {},
    isLoading: false,
  },

  showAlert: (options) => {
    set({
      alertModal: {
        open: true,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        confirmText: options.confirmText || '확인',
        onConfirm: options.onConfirm || (() => {}),
      },
    });
  },

  showConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmModal: {
          open: true,
          title: options.title,
          message: options.message,
          type: options.type || 'warning',
          confirmText: options.confirmText || '확인',
          cancelText: options.cancelText || '취소',
          onConfirm: () => {
            options.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            resolve(false);
          },
          isLoading: false,
        },
      });
    });
  },

  closeAlert: () => {
    set((state) => ({
      alertModal: { ...state.alertModal, open: false },
    }));
  },

  closeConfirm: () => {
    set((state) => ({
      confirmModal: { ...state.confirmModal, open: false, isLoading: false },
    }));
  },

  setConfirmLoading: (loading) => {
    set((state) => ({
      confirmModal: { ...state.confirmModal, isLoading: loading },
    }));
  },
}));

// Convenience functions to replace window.alert and window.confirm
export const showAlert = (
  message: string,
  title: string = '알림',
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
) => {
  useModal.getState().showAlert({ title, message, type });
};

export const showSuccess = (message: string, title: string = '성공') => {
  useModal.getState().showAlert({ title, message, type: 'success' });
};

export const showWarning = (message: string, title: string = '주의') => {
  useModal.getState().showAlert({ title, message, type: 'warning' });
};

export const showError = (message: string, title: string = '오류') => {
  useModal.getState().showAlert({ title, message, type: 'error' });
};

export const showConfirm = async (
  message: string,
  title: string = '확인',
  type: 'warning' | 'danger' = 'warning',
): Promise<boolean> => {
  return useModal.getState().showConfirm({
    title,
    message,
    type,
    onConfirm: () => {},
    onCancel: () => {},
  });
};
