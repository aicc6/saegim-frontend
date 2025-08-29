import { useState, useCallback, useRef, useEffect } from 'react';

export const useImageHandler = (maxImages: number = 3) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files;
      if (!files) return;

      const newImages = Array.from(files).filter(
        (file) =>
          file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024,
      );
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, maxImages));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [maxImages],
  );

  const handleImageRemove = useCallback((index: number): void => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddImageClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const clearImages = useCallback(() => {
    setSelectedImages([]);
  }, []);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(URL.createObjectURL(image));
      });
    };
  }, [selectedImages]);

  return {
    selectedImages,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    handleAddImageClick,
    clearImages,
    hasImages: selectedImages.length > 0,
    canAddMore: selectedImages.length < maxImages,
  };
};
