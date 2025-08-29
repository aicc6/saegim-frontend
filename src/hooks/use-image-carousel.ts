import { useState, useCallback } from 'react';
import { ImageIndices } from '@/types/calendar';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useImageCarousel');

export const useImageCarousel = () => {
  const [imageIndices, setImageIndices] = useState<ImageIndices>({});

  const rotateImage = useCallback(
    (dateStr: string, allImages: string[]) => {
      if (allImages.length > 1) {
        const currentIndex = imageIndices[dateStr] || 0;
        const nextIndex = (currentIndex + 1) % allImages.length;

        setImageIndices((prev) => ({
          ...prev,
          [dateStr]: nextIndex,
        }));

        logger.debug('이미지 순환', {
          dateStr,
          currentIndex,
          nextIndex,
          imagePath: allImages[nextIndex],
        });
      }
    },
    [imageIndices],
  );

  const getCurrentImageIndex = useCallback(
    (dateStr: string) => imageIndices[dateStr] || 0,
    [imageIndices],
  );

  return {
    imageIndices,
    rotateImage,
    getCurrentImageIndex,
  };
};
