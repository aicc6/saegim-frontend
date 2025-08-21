'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SupportForm() {
  const [supportData, setSupportData] = useState({
    title: '',
    content: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSupportData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    // TODO: API 연동
    console.log('문의 제출:', supportData);
    if (selectedImage) {
      console.log('첨부된 이미지:', selectedImage.name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-dark">
          고객센터 문의
        </h1>
        <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
          문제 발생, 제안 등을 자유롭게 작성해주세요.
          <br />
          빠시간 내에 답변 드리겠습니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* 제목 입력 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="title"
          >
            제목 입력
          </label>
          <input
            type="text"
            name="title"
            value={supportData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark"
            placeholder="제목을 입력해주세요"
          />
        </div>

        {/* 내용 입력 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="content"
          >
            내용 입력
          </label>
          <textarea
            name="content"
            value={supportData.content}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-4 py-3 bg-background-primary dark:bg-background-dark border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-primary dark:text-text-dark resize-none"
            placeholder="문의하실 내용을 자세히 작성해주세요"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label
            className="block text-sm font-medium text-text-primary dark:text-text-dark mb-2"
            htmlFor="file-upload"
          >
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
        <Button onClick={handleSubmit} className="w-full" size="lg">
          전송하기
        </Button>
      </div>
    </div>
  );
}
