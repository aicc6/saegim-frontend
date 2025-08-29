import { useEffect } from 'react';

interface UseErrorManagementProps {
  error: string | null;
  clearError: () => void;
  autoCleanupDelay?: number;
}

export const useErrorManagement = ({
  error,
  clearError,
  autoCleanupDelay = 5000,
}: UseErrorManagementProps) => {
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, autoCleanupDelay);

    return () => clearTimeout(timer);
  }, [error, clearError, autoCleanupDelay]);
};
