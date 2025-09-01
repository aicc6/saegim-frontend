import { useState, useCallback } from 'react';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useSimpleToast = () => {
  const [toastState, setToastState] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToastMessage = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastState({ show: true, message, type });
      setTimeout(
        () => setToastState((prev) => ({ ...prev, show: false })),
        2000,
      );
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    showToast: toastState.show,
    toastMessage: toastState.message,
    toastType: toastState.type,
    showToastMessage,
    hideToast,
  };
};
