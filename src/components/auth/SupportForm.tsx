'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { useApiError } from '@/hooks/use-api-error';
import { supportSchema, type SupportFormData } from '@/schemas/auth';
import { TEXT_STYLES } from '@/constants';

export default function SupportForm() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
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
      setSelectedImage(e.target.files[0]);
    }
  };

  const onSubmit = async (data: SupportFormData) => {
    try {
      // TODO: 백엔드에 Support API 구현 필요 - 현재 임시 처리
      // await apiClient.post('/api/support/inquiries', {
      //   title: data.title,
      //   content: data.content,
      //   image_attached: !!selectedImage,
      // });

      // 임시로 성공 처리 (실제로는 백엔드 API 호출 필요)
      console.log('Support inquiry (임시):', {
        title: data.title,
        content: data.content,
        image_attached: !!selectedImage,
      });

      showSuccess(
        '문의 접수 완료',
        '문의가 접수되었습니다. (현재는 개발 중인 기능입니다)',
      );

      // 폼 초기화
      reset();
      setSelectedImage(null);
    } catch (error: unknown) {
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
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-subtle dark:border-border-dark border-dashed rounded-lg cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 transition-colors">
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
              <div className="flex text-sm text-text-secondary dark:text-text-dark-secondary">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                >
                  <span>이미지 업로드</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* 전송 버튼 */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? '전송 중...' : '전송하기'}
        </Button>
      </form>
    </div>
  );
}
