'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { apiClient } from '@/lib/api/client';
import { supportSchema, type SupportFormData } from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function SupportForm() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const { handleApiError, showSuccess } = useApiError({
    loggerName: 'SupportForm',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    mode: 'onBlur',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        handleApiError(
          new Error('파일 크기 초과'),
          '파일 크기 초과',
          '파일 크기는 10MB 이하여야 합니다.',
        );
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        handleApiError(
          new Error('잘못된 파일 타입'),
          '잘못된 파일 타입',
          '이미지 파일만 업로드 가능합니다.',
        );
        return;
      }

      setSelectedImage(file);

      // 이미지 미리보기와 Base64 인코딩을 동시에 처리
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);

        // Base64 데이터 추출 (data:image/jpeg;base64, 부분 제거)
        const base64Data = result.split(',')[1];
        setImageBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageBase64(null);
  };

  const onSubmit = async (data: SupportFormData) => {
    try {
      console.log('폼 제출 시작:', {
        title: data.title,
        content: data.content,
        image_attached: !!selectedImage,
        image_filename: selectedImage?.name,
        image_type: selectedImage?.type,
        image_base64_length: imageBase64?.length,
      });

      // 백엔드 API 호출 (로그인한 사용자용)
      const response = await apiClient.post('/api/support/inquiries', {
        title: data.title,
        content: data.content,
        image_attached: !!selectedImage,
        image_data: imageBase64, // Base64 이미지 데이터
        image_filename: selectedImage?.name || null, // 이미지 파일명
        image_type: selectedImage?.type || null, // 이미지 타입
      });

      console.log('API 응답 성공:', response.data);

      showSuccess(
        '문의 접수 완료',
        '문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.',
      );

      // 폼 초기화
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      setImageBase64(null);
    } catch (error: unknown) {
      console.error('폼 제출 실패:', error);
      handleApiError(
        error,
        '문의 접수 실패',
        '문의 접수 중 오류가 발생했습니다.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className={TEXT_STYLES.heading.h1}>고객센터 문의</h1>
        <p className={TEXT_STYLES.description}>
          문제 발생, 제안 등을 자유롭게 작성해주세요.
          <br />
          빠시간 내에 답변 드리겠습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 제목 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="title">
            제목 입력
          </label>
          <FormInput
            type="text"
            id="title"
            {...register('title')}
            placeholder="제목을 입력해주세요"
            error={errors.title?.message}
            disabled={isSubmitting}
          />
        </div>

        {/* 내용 입력 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="content">
            내용 입력
          </label>
          <textarea
            id="content"
            {...register('content')}
            rows={6}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark resize-none"
            placeholder="문의하실 내용을 자세히 작성해주세요"
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className={TEXT_STYLES.label} htmlFor="file-upload">
            스크린샷/이미지 업로드
          </label>

          {imagePreview ? (
            // 이미지 미리보기
            <div className="mt-2 relative">
              <Image
                src={imagePreview}
                alt="업로드된 이미지"
                width={400}
                height={192}
                className="w-full max-w-md h-48 object-cover rounded-lg border border-border-subtle dark:border-border-dark"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
          ) : (
            // 이미지 업로드 영역 - 클릭 가능하게 수정
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-subtle dark:border-border-dark border-dashed rounded-lg cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('file-upload')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  document.getElementById('file-upload')?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="이미지 업로드"
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-text-secondary dark:text-text-dark-secondary"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-text-secondary dark:text-text-dark-secondary">
                  <span className="font-medium text-primary hover:text-primary/80">
                    이미지 업로드
                  </span>
                </div>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                  PNG, JPG, GIF up to 10MB
                </p>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                  클릭하여 파일 선택
                </p>
              </div>

              {/* 숨겨진 파일 입력 */}
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        {/* 전송 버튼 - 새김 버튼 스타일 적용 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full saegim-button saegim-button-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '전송 중...' : '전송하기'}
        </button>
      </form>
    </div>
  );
}
