import { useCallback } from 'react';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useClipboard');

export const useClipboard = (onSuccess?: () => void) => {
  const copyToClipboard = useCallback(
    async (content: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(content);
        onSuccess?.();
      } catch (error) {
        logger.error('클립보드 복사 실패', { error });
      }
    },
    [onSuccess],
  );

  return {
    copyToClipboard,
  };
};
