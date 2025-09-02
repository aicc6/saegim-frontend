import Image from 'next/image';
import { getLogger } from '@/lib/logger';

const logger = getLogger('ThumbnailImage');

interface ThumbnailImageProps {
  allImages: string[];
  currentImageIndex: number;
  dateStr: string;
  onImageRotate: (dateStr: string, allImages: string[]) => void;
}

export const ThumbnailImage = ({
  allImages,
  currentImageIndex,
  dateStr,
  onImageRotate,
}: ThumbnailImageProps) => {
  if (!allImages || allImages.length === 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageRotate(dateStr, allImages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Enter' || e.key === ' ') {
      onImageRotate(dateStr, allImages);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');
  
  if (!baseUrl) {
    logger.error('NEXT_PUBLIC_API_BASE_URL 환경변수가 설정되지 않았습니다.');
    return null;
  }
  
  const imageUrl = `${baseUrl}/api/public/image-proxy?url=${encodeURIComponent(allImages[currentImageIndex])}`;

  return (
    <div className="top-1 left-1/2 transform -translate-x-1/2 relative z-10">
      <div className="flex justify-center overflow-hidden">
        <div
          className="flex-shrink-0 relative group cursor-pointer overflow-hidden"
          style={{
            width: 'clamp(40px, 8vw, 90px)',
            height: 'clamp(30px, 5vw, 70px)',
            maxWidth: '70%',
            maxHeight: '40%',
          }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="다음 이미지로 넘어가기"
        >
          <Image
            src={imageUrl}
            alt="다이어리 이미지"
            width={90}
            height={70}
            className="w-full h-full object-contain rounded-sm border border-white shadow-sm transition-all duration-200 bg-gray-50"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxHeight: '100%',
              maxWidth: '100%',
            }}
            onError={(e) => {
              logger.warn('캘린더 썸네일 이미지 로드 실패', {
                imagePath: allImages[currentImageIndex],
                dateStr,
              });
              e.currentTarget.style.display = 'none';
            }}
          />
          {allImages.length > 1 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 text-white text-xs flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              →
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
