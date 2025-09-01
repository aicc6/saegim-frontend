import { useState, useCallback, useRef, useEffect } from 'react';

export const useImageHandler = (maxImages: number = 3) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files;
      if (!files) return;

      const newImages = Array.from(files).filter(
        (file) =>
          file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024,
      );

      // 이전 URL들 정리
      imageUrls.forEach((url) => URL.revokeObjectURL(url));

      const updatedImages = [...selectedImages, ...newImages].slice(
        0,
        maxImages,
      );
      // 새로운 URL들 생성 및 저장
      const newUrls = updatedImages.map((file) => URL.createObjectURL(file));
      setImageUrls(newUrls);
      setSelectedImages(updatedImages);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [maxImages, imageUrls, selectedImages],
  );

  const handleImageRemove = useCallback(
    (index: number): void => {
      // 해당 인덱스의 URL 정리
      if (imageUrls[index]) {
        URL.revokeObjectURL(imageUrls[index]);
      }
      setImageUrls((prev) => prev.filter((_, i) => i !== index));
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    },
    [imageUrls],
  );

  const handleAddImageClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const clearImages = useCallback(() => {
    // 모든 URL 정리
    imageUrls.forEach((url) => URL.revokeObjectURL(url));
    setImageUrls([]);
    setSelectedImages([]);
  }, [imageUrls]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  return {
    selectedImages,
    imageUrls,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    handleAddImageClick,
    clearImages,
    hasImages: selectedImages.length > 0,
    canAddMore: selectedImages.length < maxImages,
  };
};
