'use client';

import { useState } from 'react';

const SupportPage = () => {
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
    <div
      className="flex flex-col h-screen"
      style={{
        backgroundColor: 'var(--page-background)',
      }}
    >
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto mt-16 p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
                고객센터 문의
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                문제 발생, 제안 등을 자유롭게 작성해주세요.
                <br />
                빠시간 내에 답변 드리겠습니다.
              </div>

              <div className="space-y-6">
                {/* 제목 입력 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="title"
                  >
                    제목 입력
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={supportData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="제목을 입력해주세요"
                  />
                </div>

                {/* 내용 입력 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="content"
                  >
                    내용 입력
                  </label>
                  <textarea
                    name="content"
                    value={supportData.content}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-50 dark:focus:ring-sage-50 focus:border-sage-50 dark:focus:border-sage-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="문의하실 내용을 자세히 작성해주세요"
                  />
                </div>

                {/* 이미지 업로드 */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                    htmlFor="file-upload"
                  >
                    스크린샷/이미지 업로드
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-sage-50 dark:hover:border-sage-50 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
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
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-sage-50 hover:text-sage-70 focus-within:outline-none"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* 전송 버튼 */}
                <button
                  onClick={handleSubmit}
                  className="w-full saegim-button saegim-button-large"
                >
                  전송하기
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupportPage;
