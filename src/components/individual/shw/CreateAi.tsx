'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Select from '../../ui/custom/Select';
import { useCreateStore } from '@/stores/create';
import { useEmotionStore } from '@/stores/emotion';

// 초기 입력 화면 전용 컴포넌트

export default function CreateAi() {
  const router = useRouter();

  const {
    config,
    prompt,
    style,
    length,
    isGenerating,
    setPrompt,
    setStyle,
    setLength,
    generateText,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
  } = useEmotionStore();

  // 글 생성 후 세션 페이지로 이동
  const handleGenerateText = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    try {
      console.log('글 생성 시작:', { prompt, emotion }); // 디버그 로그

      // generateText 실행 (이미 세션 생성 로직 포함)
      await generateText(emotion);

      console.log('글 생성 완료'); // 디버그 로그

      // 생성된 세션 ID 가져오기
      const { currentSessionId } = useCreateStore.getState();

      console.log('현재 세션 ID:', currentSessionId); // 디버그 로그

      if (currentSessionId) {
        console.log('리다이렉트 시작:', `/${currentSessionId}`); // 디버그 로그
        // 세션 ID로 리다이렉트
        router.push(`/${currentSessionId}`);
      } else {
        console.error('세션 ID가 생성되지 않았습니다.');
      }
    } catch (error) {
      console.error('글 생성 실패:', error);
    }
  }, [prompt, emotion, isGenerating, generateText, router]);

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

  // 초기 화면
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

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="예: 바람, 초록빛 오후, 천천히 걷는 길"
        className="w-full rounded-xl border border-border-subtle bg-white p-4 text-body text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus shadow-card resize-none mt-15"
      />

      <div className="mt-6 space-y-6">
        {/* 문체와 길이 선택 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-body-small text-text-secondary">
              문체 선택
            </label>
            <Select
              value={style}
              onChange={(v) => setStyle(v as any)}
              options={styleOptions}
              ariaLabel="문체 선택"
            />
          </div>
          <div>
            <label className="mb-2 block text-body-small text-text-secondary">
              길이 선택
            </label>
            <Select
              value={length}
              onChange={(v) => setLength(v as any)}
              options={lengthOptions}
              ariaLabel="길이 선택"
            />
          </div>
        </div>

        {/* 감정 선택 */}
        <div>
          <label className="mb-3 block text-body-small text-text-secondary">
            감정을 선택해주세요 😊 (선택 사항)
          </label>
          <div className="flex flex-wrap gap-3 justify-center">
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
        className="mt-8 w-full rounded-xl bg-sage-90 px-6 py-4 text-body-large font-semibold text-text-on-color hover:bg-sage-100 active:bg-sage-80 disabled:opacity-60 transition-colors shadow-card"
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
