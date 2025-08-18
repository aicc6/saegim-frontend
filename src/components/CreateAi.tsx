'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { CiLocationArrow1 } from 'react-icons/ci';
import { MdNavigateNext } from 'react-icons/md';
import { GrFormPrevious } from 'react-icons/gr';
import Select from './ui/custom/Select';
import { useCreateStore } from '@/stores/create';
import { NotebookPen } from 'lucide-react';

// 타입 정의
type WritingStyle = '시' | '단편글';
type LengthOption = '단문' | '중문' | '장문';
type EmotionOption = '' | '슬픔' | '기쁨' | '분노' | '당황' | '평온';

// 결과 카드 데이터 구조
interface GeneratedResult {
  id: number;
  content: string;
  style: WritingStyle;
  length: LengthOption;
  emotion: EmotionOption;
  prompt: string;
  createdAt: Date;
  isRegenerating?: boolean;
  history: string[];
  currentHistoryIndex: number;
  regenerateCount: number;
}

// 상수 배열들 (백엔드에서 가져올 데이터)
const CONFIG = {
  styles: [
    { value: '시' as WritingStyle, label: '시', displayName: 'poem' },
    { value: '단편글' as WritingStyle, label: '단편글', displayName: 'prose' },
  ],
  lengths: [
    { value: '단문' as LengthOption, label: '단문', displayName: 'short' },
    { value: '중문' as LengthOption, label: '중문', displayName: 'medium' },
    { value: '장문' as LengthOption, label: '장문', displayName: 'long' },
  ],
  emotions: [
    {
      value: '기쁨' as EmotionOption,
      label: '기쁨',
      emoji: '😄',
      styles: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        ring: 'ring-yellow-300',
      },
    },
    {
      value: '슬픔' as EmotionOption,
      label: '슬픔',
      emoji: '😢',
      styles: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        ring: 'ring-blue-300',
      },
    },
    {
      value: '분노' as EmotionOption,
      label: '분노',
      emoji: '😠',
      styles: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-300' },
    },
    {
      value: '당황' as EmotionOption,
      label: '당황',
      emoji: '😰',
      styles: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        ring: 'ring-orange-300',
      },
    },
    {
      value: '평온' as EmotionOption,
      label: '평온',
      emoji: '😌',
      styles: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        ring: 'ring-green-300',
      },
    },
  ],
  maxRegenerateCount: 5,
  loadingDelay: 450,
};

// 임시 텍스트 생성 함수 (백엔드 API로 대체 예정)
function generateText(
  prompt: string,
  style: WritingStyle,
  length: LengthOption,
  emotion: EmotionOption,
): string {
  const trimmed = prompt.trim();
  if (!trimmed) return '';

  const emotionTone = emotion ? `${emotion}이 배어있는` : '담담한';

  if (style === '시') {
    const linesCount = length === '단문' ? 3 : length === '중문' ? 5 : 7;
    const lines: string[] = [];
    for (let i = 0; i < linesCount; i++) {
      if (i === 0) lines.push(`${trimmed} 위로`);
      else if (i === 1) lines.push(`${emotionTone} 마음이 스며들고`);
      else if (i === linesCount - 1) lines.push(`오늘의 나를 조심스레 새긴다`);
      else lines.push(`사이사이 숨을 고르며, ${trimmed}을(를) 떠올린다`);
    }
    return lines.join('\n');
  }

  const sentencesCount = length === '단문' ? 2 : length === '중문' ? 3 : 4;
  const sentences: string[] = [];
  for (let i = 0; i < sentencesCount; i++) {
    if (i === 0)
      sentences.push(
        `${trimmed}에 대해 생각해 본다. ${emotionTone} 감정이 가볍게 배어 나온다.`,
      );
    else if (i === sentencesCount - 1)
      sentences.push(
        `나는 오늘의 감정을 조용히 기록한다. 그리고 그 안에서 작은 나를 다시 발견한다.`,
      );
    else
      sentences.push(
        `사소한 기척들 속에서 ${trimmed}은(는) 형태를 바꾸고, 나도 조금은 달라진다.`,
      );
  }
  return sentences.join(' ');
}

export default function CreateAi() {
  const [showToast, setShowToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    config,
    prompt,
    style,
    length,
    emotion,
    isGenerating,
    generatedResults,
    setPrompt,
    setStyle,
    setLength,
    setEmotion,
    generateText,
    regenerateText,
    navigateHistory,
    saveToDiary,
    getStyleDisplayName,
    getLengthDisplayName,
    getEmotionConfig,
  } = useCreateStore();

  // textarea 높이 조절 최적화
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200;

    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  }, []);

  // 클립보드 복사 최적화
  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // 엔터키 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
        e.preventDefault();
        generateText();
      }
    },
    [isGenerating, prompt, generateText],
  );

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

  // Effects
  useEffect(() => adjustTextareaHeight(), [prompt, adjustTextareaHeight]);

  useEffect(() => {
    if (prompt === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  }, [prompt]);

  // 결과 화면 렌더링
  if (generatedResults.length > 0 || isGenerating) {
    return (
      <div className="flex min-h-screen flex-col relative">
        {/* 결과 영역 */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="mx-auto max-w-2xl space-y-4">
            {generatedResults.map((result) => (
              <div
                key={result.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* 헤더 */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">생성된 글</span>
                    {result.history.length > 1 && (
                      <span className="text-xs text-gray-400">
                        ({result.currentHistoryIndex + 1}/
                        {result.history.length})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {result.emotion && (
                      <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                        {result.emotion}
                      </span>
                    )}
                    <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                      {getLengthDisplayName(result.length)}
                    </span>
                    <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                      {getStyleDisplayName(result.style)}
                    </span>
                  </div>
                </div>

                {/* 내용 */}
                <div className="space-y-2 text-gray-800 leading-relaxed">
                  {result.isRegenerating ? (
                    <div className="space-y-3 animate-pulse">
                      {[100, 90, 80].map((width, idx) => (
                        <div
                          key={idx}
                          className={`h-4 w-${width === 100 ? 'full' : width === 90 ? '11/12' : '5/6'} rounded bg-gray-200`}
                        />
                      ))}
                    </div>
                  ) : result.style === '시' ? (
                    result.content
                      .split('\n')
                      .map((line, idx) => <div key={idx}>{line}</div>)
                  ) : (
                    result.content
                  )}
                </div>

                {/* 액션 버튼들 */}
                <div className="mt-6 flex gap-2">
                  <ActionButton
                    onClick={() => copyToClipboard(result.content)}
                    disabled={!!result.isRegenerating}
                    text="복사하기"
                  />

                  <ActionButton
                    onClick={() => saveToDiary(result.id)}
                    disabled={!!result.isRegenerating}
                    text="다이어리에 저장"
                    icon={<NotebookPen className="h-4 w-4" />}
                  />

                  {/* 히스토리 네비게이션 */}
                  {result.history.length > 1 && (
                    <>
                      {result.currentHistoryIndex > 0 && (
                        <ActionButton
                          onClick={() => navigateHistory(result, 'prev')}
                          disabled={!!result.isRegenerating}
                          text="이전"
                          icon={<GrFormPrevious className="h-4 w-4" />}
                        />
                      )}
                      {result.currentHistoryIndex <
                        result.history.length - 1 && (
                        <ActionButton
                          onClick={() => navigateHistory(result, 'next')}
                          disabled={!!result.isRegenerating}
                          text="다음"
                          icon={<MdNavigateNext className="h-4 w-4" />}
                        />
                      )}
                    </>
                  )}

                  {/* 재생성 */}
                  {result.regenerateCount < config.maxRegenerateCount && (
                    <ActionButton
                      onClick={() => regenerateText(result)}
                      disabled={!!result.isRegenerating}
                      text={`다시 생성 (${result.regenerateCount}/${config.maxRegenerateCount})`}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* 로딩 상태 */}
            {isGenerating && (
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-3 animate-pulse">
                  {[40, 100, 90, 80].map((width, idx) => (
                    <div
                      key={idx}
                      className={`h-4 rounded bg-gray-200 ${width === 40 ? 'w-2/5' : width === 100 ? 'w-full' : width === 90 ? 'w-11/12' : 'w-5/6'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 감정 선택 안내 */}
            <EmotionGuide
              emotion={emotion}
              config={config}
              setEmotion={setEmotion}
              getEmotionConfig={getEmotionConfig}
            />
          </div>
        </div>

        {/* 하단 고정 입력 영역 */}
        <div className="sticky bottom-0 z-50 border-t border-gray-200 rounded-t-4xl bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-2xl p-4 space-y-3">
            {/* 메인 입력창 */}
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  adjustTextareaHeight();
                }}
                rows={1}
                placeholder="메시지를 입력하세요..."
                className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm resize-none min-h-[44px]"
                style={{ height: 'auto' }}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={generateText}
                disabled={isGenerating || !prompt.trim()}
                className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl"
              >
                <CiLocationArrow1 className="text-sage-100" />
              </button>
            </div>

            {/* 옵션 선택 */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex gap-2">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {styleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 감정 이모지 */}
              <div className="flex gap-1 ml-auto">
                {config.emotions.map(({ value, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEmotion(emotion === value ? '' : value)}
                    className={`h-8 w-8 rounded-full text-sm transition-all ${
                      emotion === value
                        ? 'bg-green-100 ring-2 ring-green-300 scale-110'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 토스트 */}
        {showToast && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
              복사되었습니다
            </div>
          </div>
        )}
      </div>
    );
  }

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
            {config.emotions.map(({ value, emoji, label }) => (
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
              {emotion || '감정 선택 안함'}
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={generateText}
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

// 재사용 가능한 액션 버튼 컴포넌트
const ActionButton = ({
  onClick,
  disabled,
  text,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean; // optional로 변경
  text: string;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors ${
      disabled
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon &&
      (typeof icon === 'string' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      ) : (
        icon
      ))}
    {text}
  </button>
);

// 감정 가이드 컴포넌트
const EmotionGuide = ({
  emotion,
  config,
  setEmotion,
  getEmotionConfig,
}: any) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-medium">
        AI가 추측한 감정은 {emotion || '감정 선택 안함'}
        {emotion && getEmotionConfig(emotion)?.emoji} 입니다.
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      다른 감정을 원하시면 아래에 선택해 주세요
    </p>
    <div className="flex gap-2">
      {config.emotions.map(({ value, emoji, label, styles }: any) => {
        const isSelected = emotion === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setEmotion(emotion === value ? '' : value)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
              isSelected
                ? `${styles.bg} ring-2 ${styles.ring}`
                : 'hover:bg-gray-50'
            }`}
            aria-label={label}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  </div>
);
