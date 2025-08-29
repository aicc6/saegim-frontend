import { useState, useCallback } from 'react';

export const useSimpleToast = () => {
  const [showToast, setShowToast] = useState<boolean>(false);

  const showToastMessage = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const hideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  return {
    showToast,
    showToastMessage,
    hideToast,
  };
};
