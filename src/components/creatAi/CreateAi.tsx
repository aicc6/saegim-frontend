'use client';

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCreateStore, WritingStyle, LengthOption } from '@/stores/create';
import { useEmotionStore } from '@/stores/emotion';
import { getLogger } from '@/lib/logger';
import Select from '../ui/custom/Select';

const logger = getLogger('CreateAi');

// 초기 입력 화면 전용 컴포넌트

export default function CreateAi() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const {
    config,
    prompt,
    style,
    length,
    isGenerating,
    error,
    setPrompt,
    setStyle,
    setLength,
    generateText,
    clearError,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
  } = useEmotionStore();

  // 에러가 있으면 자동으로 5초 후 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 이미지 파일 선택 핸들러
  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const newImages = Array.from(files).filter(
          (file) =>
            file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024, // 5MB 제한
        );
        setSelectedImages((prev) => [...prev, ...newImages].slice(0, 3)); // 최대 3개까지
      }
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [],
  );

  // 이미지 삭제 핸들러
  const handleImageRemove = useCallback((index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 이미지 추가 버튼 클릭 핸들러
  const handleAddImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 컴포넌트 언마운트 시 URL 객체 정리
  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(URL.createObjectURL(image));
      });
    };
  }, [selectedImages]);

  // 글 생성 후 세션 페이지로 이동
  const handleGenerateText = useCallback(async () => {
    // 입력값 검증
    if (!prompt.trim()) {
      alert('텍스트를 입력해주세요');
      return;
    }

    if (!style) {
      alert('문체를 선택해주세요');
      return;
    }

    if (!length) {
      alert('길이를 선택해주세요');
      return;
    }

    if (isGenerating) return;

    try {
      // generateText 실행 (이미 세션 생성 로직 포함)
      await generateText(emotion);

      // 생성된 세션 ID 가져오기
      const { sessionId } = useCreateStore.getState();

      if (sessionId) {
        // textarea 초기화
        setPrompt('');
        // 세션 ID로 리다이렉트
        router.push(`/${sessionId}`);
      } else {
        logger.error('세션 ID가 생성되지 않았습니다');
      }
    } catch (error) {
      logger.error('글 생성 실패', { error });
    }
  }, [
    prompt,
    style,
    length,
    emotion,
    isGenerating,
    generateText,
    router,
    setPrompt,
  ]);

  // 메모이제이션된 옵션들
  const { styleOptions, lengthOptions } = useMemo(
    () => ({
      styleOptions: config.styles.map(({ value, label }) => ({ value, label })),
      lengthOptions: config.lengths.map(({ value, label }) => ({
        value,
        label,
      })),
    }),
    [config.styles, config.lengths],
  );

  // 결과가 있으면 CreateChat 컴포넌트를 사용하도록 안내
  // (실제로는 페이지 라우팅으로 처리될 예정)

  return (
    <div className="rounded-3xl bg-ivory-cream shadow-card relative p-6 sm:p-8">
      <h1 className="text-4xl font-poetic font-bold text-[#3F764A] text-center">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-soft-rose text-3xl">✿</span>
          어떤 글을 만들어드릴까요?
        </span>
      </h1>

      <p className="mt-2 text-body text-text-primary text-center">
        키워드나 짧은 글을 입력하면 AI가 감정적인 글을 생성해 드립니다
      </p>

      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
              aria-label="에러 메시지 닫기"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 선택된 이미지들 미리보기 */}
      {selectedImages.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`선택된 이미지 ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-sage-30"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {selectedImages.length}/3개 이미지 선택됨
          </p>
        </div>
      )}

      {/* textarea와 이미지 추가 버튼 */}
      <div className="relative mt-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="예: 바람, 초록빛 오후, 천천히 걷는 길"
          className="w-full rounded-xl border border-border-subtle bg-white p-4 pr-12 text-body text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus shadow-card resize-none"
        />

        {/* 이미지 추가 버튼 - textarea 내부 오른쪽 위 */}
        {selectedImages.length < 3 && (
          <button
            type="button"
            onClick={handleAddImageClick}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-sage-60 hover:text-sage-80 hover:bg-sage-10 rounded-lg transition-colors"
            title="이미지 추가"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      <div className="mt-6 space-y-6">
        {/* 문체와 길이 선택 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              id="style-label"
              className="mb-2 block text-body-small text-text-secondary"
            >
              문체 선택
            </div>
            <Select
              value={style}
              onChange={(v) => setStyle(v as WritingStyle)}
              options={styleOptions}
              ariaLabel="문체 선택"
            />
          </div>
          <div>
            <div
              id="length-label"
              className="mb-2 block text-body-small text-text-secondary"
            >
              길이 선택
            </div>
            <Select
              value={length}
              onChange={(v) => setLength(v as LengthOption)}
              options={lengthOptions}
              ariaLabel="길이 선택"
            />
          </div>
        </div>

        {/* 감정 선택 */}
        <div>
          <div className="mb-3 block text-body-small text-text-secondary">
            감정을 선택해주세요 😊 (선택 사항)
          </div>
          <div
            className="flex flex-wrap gap-3 justify-center"
            role="group"
            aria-label="감정 선택"
          >
            {emotionConfigs.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEmotion(emotion === value ? '' : value)}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl transition-all ${
                  emotion === value
                    ? 'border-sage-60 bg-sage-50 shadow-md scale-110'
                    : 'border-sage-20 bg-white hover:border-sage-40 hover:bg-sage-10 hover:scale-105'
                }`}
                aria-label={`${label} 선택`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-body-small text-text-secondary">
            선택된 감정:{' '}
            <span className="font-medium text-sage-100">
              {emotion
                ? emotionConfigs.find((e) => e.value === emotion)?.label ||
                  emotion
                : '감정 선택 안함'}
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerateText}
        disabled={isGenerating || !prompt.trim()}
        className="mt-8 w-full rounded-xl bg-sage-90 px-6 py-4 text-body-large font-semibold text-text-on-color hover:bg-sage-100 active:bg-sage-80 disabled:opacity-40 transition-colors shadow-card"
      >
        {isGenerating ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sage-30 border-t-sage-70" />
            생성 중...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            글 생성하기
          </span>
        )}
      </button>
    </div>
  );
}
