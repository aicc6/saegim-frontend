import Image from 'next/image';

interface ImagePreviewProps {
  selectedImages: File[];
  onRemove: (index: number) => void;
}

export const ImagePreview = ({
  selectedImages,
  onRemove,
}: ImagePreviewProps) => {
  if (selectedImages.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
        {selectedImages.map((image, index) => (
          <div key={index} className="relative group">
            <Image
              src={URL.createObjectURL(image)}
              alt={`선택된 이미지 ${index + 1}`}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-lg border-2 border-sage-30"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {selectedImages.length}/3개 이미지 선택됨
      </p>
    </div>
  );
};
