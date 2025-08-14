'use client';

import { useMemo, useState } from 'react';
import Select, { type SelectOption } from './ui/Select';
import { CiLocationArrow1 } from 'react-icons/ci';
import { MdNavigateNext } from 'react-icons/md';
import { GrFormPrevious } from 'react-icons/gr';

type WritingStyle = '시' | '단편글';
type LengthOption = '단문' | '중문' | '장문';
type EmotionOption = '' | '슬픔' | '기쁨' | '분노' | '당황' | '평온';

// 감정별 이모지 매핑
const emotionEmojis: Record<Exclude<EmotionOption, ''>, string> = {
  기쁨: '😊',
  슬픔: '😢',
  분노: '😠',
  당황: '😰',
  평온: '😌',
};

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
  history: string[]; // 이전 생성 내용들
  currentHistoryIndex: number; // 현재 보고 있는 히스토리 인덱스
  regenerateCount: number; // 재생성 횟수
}

// 액션 버튼 데이터 구조
interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
}

// 스타일 매핑
const STYLE_DISPLAY_MAP: Record<WritingStyle, string> = {
  시: 'poem',
  단편글: 'prose',
};

const LENGTH_DISPLAY_MAP: Record<LengthOption, string> = {
  단문: 'short',
  중문: 'medium',
  장문: 'long',
};

// 감정별 스타일 매핑
const EMOTION_STYLE_MAP: Record<
  Exclude<EmotionOption, ''>,
  { bg: string; text: string; ring: string }
> = {
  기쁨: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    ring: 'ring-yellow-300',
  },
  슬픔: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-300' },
  분노: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-300' },
  당황: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    ring: 'ring-orange-300',
  },
  평온: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-300' },
};

function generateText(
  prompt: string,
  style: WritingStyle,
  length: LengthOption,
  emotion: EmotionOption,
): string {
  const trimmed = prompt.trim();
  if (!trimmed) return '';

  const emotionMood: Record<
    Exclude<EmotionOption, ''>,
    { tone: string; color: string }
  > = {
    기쁨: { tone: '따스한 기쁨', color: 'emotion-happy' },
    슬픔: { tone: '잔잔한 슬픔', color: 'emotion-sad' },
    분노: { tone: '서늘한 분노', color: 'emotion-angry' },
    당황: { tone: '어수선한 당황', color: 'emotion-worried' },
    평온: { tone: '고요한 평온', color: 'emotion-peaceful' },
  } as const;

  const tone = emotion ? emotionMood[emotion].tone : '담담한 마음';

  if (style === '시') {
    const linesCount = length === '단문' ? 3 : length === '중문' ? 5 : 7;
    const lines: string[] = [];
    for (let i = 0; i < linesCount; i++) {
      if (i === 0) lines.push(`${trimmed} 위로`);
      else if (i === 1) lines.push(`${tone}이 스며들고`);
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
        `${trimmed}에 대해 생각해 본다. ${tone}이 가볍게 배어 나온다.`,
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
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<WritingStyle>('시');
  const [length, setLength] = useState<LengthOption>('단문');
  const [emotion, setEmotion] = useState<EmotionOption>('평온');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    [],
  );

  // 옵션 데이터 (백엔드에서 가져올 수 있음)
  const styleOptions: SelectOption[] = [
    { value: '시', label: '시' },
    { value: '단편글', label: '단편글' },
  ];

  const lengthOptions: SelectOption[] = [
    { value: '단문', label: '단문' },
    { value: '중문', label: '중문' },
    { value: '장문', label: '장문' },
  ];

  // 액션 버튼 생성 함수 (백엔드 API 호출 함수들로 대체 예정)
  const createActionButtons = (result: GeneratedResult): ActionButton[] => {
    const buttons: ActionButton[] = [
      {
        id: 'copy',
        label: '복사하기',
        onClick: () => {
          navigator.clipboard.writeText(result.content);
          // TODO: 토스트 메시지 표시
        },
      },
      {
        id: 'save-diary',
        label: '다이어리에 저장',
        icon: 'document',
        onClick: () => {
          // TODO: API 호출 - saveToDiary(result.id)
          console.log('다이어리에 저장:', result.id);
        },
      },
    ];

    // 히스토리 네비게이션 버튼들
    if (result.history.length > 1) {
      if (result.currentHistoryIndex > 0) {
        buttons.push({
          id: 'prev-history',
          label: '이전',
          icon: 'arrow-left',
          onClick: () => goToPreviousHistory(result),
        });
      }

      if (result.currentHistoryIndex < result.history.length - 1) {
        buttons.push({
          id: 'next-history',
          label: '다음',
          icon: 'arrow-right',
          onClick: () => goToNextHistory(result),
        });
      }
    }

    // 재생성 버튼 (5번 제한)
    if (result.regenerateCount < 5) {
      buttons.push({
        id: 'regenerate',
        label: `다시 생성 (${result.regenerateCount}/5)`,
        onClick: () => {
          handleRegenerate(result);
        },
      });
    }

    return buttons;
  };

  // 감정별 이모지 버튼 데이터
  const emotionButtons = [
    { emotion: '', emoji: '😊', label: '선택 안함' },
    { emotion: '기쁨', emoji: '😄', label: '기쁨' },
    { emotion: '슬픔', emoji: '😢', label: '슬픔' },
    { emotion: '분노', emoji: '😠', label: '분노' },
    { emotion: '평온', emoji: '😌', label: '평온' },
  ];

  // 생성 함수 (백엔드 API로 대체 예정)
  const onGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      // TODO: 실제 API 호출
      // const response = await generateTextAPI({ prompt, style, length, emotion });

      // 임시 로딩
      await new Promise((r) => setTimeout(r, 450));

      const content = generateText(prompt, style, length, emotion);
      const newResult: GeneratedResult = {
        id: Date.now(), // TODO: 백엔드에서 생성된 ID 사용
        content,
        style,
        length,
        emotion,
        prompt,
        createdAt: new Date(),
        history: [content], // 첫 번째 생성 내용을 히스토리에 추가
        currentHistoryIndex: 0,
        regenerateCount: 0,
      };

      setGeneratedResults((prev) => [newResult, ...prev]);
    } catch (error) {
      console.error('텍스트 생성 실패:', error);
      // TODO: 에러 처리 UI
    } finally {
      setIsGenerating(false);
    }
  };

  // 재생성 함수
  const handleRegenerate = async (result: GeneratedResult) => {
    // 재생성 횟수 제한 확인
    if (result.regenerateCount >= 5) {
      alert('재생성은 최대 5번까지만 가능합니다.');
      return;
    }

    try {
      // 해당 결과를 로딩 상태로 설정
      setGeneratedResults((prev) =>
        prev.map((item) =>
          item.id === result.id ? { ...item, isRegenerating: true } : item,
        ),
      );

      // 임시 로딩
      await new Promise((r) => setTimeout(r, 450));

      const newContent = generateText(
        result.prompt,
        result.style,
        result.length,
        result.emotion,
      );

      // 해당 결과의 내용과 히스토리 업데이트
      setGeneratedResults((prev) =>
        prev.map((item) =>
          item.id === result.id
            ? {
                ...item,
                content: newContent,
                createdAt: new Date(),
                isRegenerating: false,
                history: [...item.history, newContent], // 새 내용을 히스토리에 추가
                currentHistoryIndex: item.history.length, // 새 내용을 현재 인덱스로 설정
                regenerateCount: item.regenerateCount + 1, // 재생성 횟수 증가
              }
            : item,
        ),
      );
    } catch (error) {
      console.error('텍스트 재생성 실패:', error);
      // 로딩 상태 해제
      setGeneratedResults((prev) =>
        prev.map((item) =>
          item.id === result.id ? { ...item, isRegenerating: false } : item,
        ),
      );
    }
  };

  // 히스토리 네비게이션 함수들
  const goToPreviousHistory = (result: GeneratedResult) => {
    if (result.currentHistoryIndex > 0) {
      const newIndex = result.currentHistoryIndex - 1;
      setGeneratedResults((prev) =>
        prev.map((item) =>
          item.id === result.id
            ? {
                ...item,
                content: item.history[newIndex],
                currentHistoryIndex: newIndex,
              }
            : item,
        ),
      );
    }
  };

  const goToNextHistory = (result: GeneratedResult) => {
    if (result.currentHistoryIndex < result.history.length - 1) {
      const newIndex = result.currentHistoryIndex + 1;
      setGeneratedResults((prev) =>
        prev.map((item) =>
          item.id === result.id
            ? {
                ...item,
                content: item.history[newIndex],
                currentHistoryIndex: newIndex,
              }
            : item,
        ),
      );
    }
  };

  // 감정 스타일 가져오기
  const getEmotionStyle = (emotion: EmotionOption) => {
    if (!emotion) return null;
    return EMOTION_STYLE_MAP[emotion as Exclude<EmotionOption, ''>];
  };

  // 결과 화면 렌더링
  if (generatedResults.length > 0 || isGenerating) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* 상단 결과 영역 */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 로딩 상태 */}
            {isGenerating && (
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-2/5 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-11/12 rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
                </div>
              </div>
            )}

            {/* 생성된 결과들 */}
            {generatedResults.map((result, index) => {
              const actionButtons = createActionButtons(result);

              return (
                <div
                  key={result.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  {/* 헤더 */}

                  <div className="mb-4 flex justify-between items-center ">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">생성된 글</span>
                      {result.history.length > 1 && (
                        <span className="text-xs text-gray-400">
                          ({result.currentHistoryIndex + 1}/
                          {result.history.length})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        {result.emotion && (
                          <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                            {result.emotion}
                          </span>
                        )}
                        <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                          {LENGTH_DISPLAY_MAP[result.length]}
                        </span>
                        <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                          {STYLE_DISPLAY_MAP[result.style]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="space-y-2 text-gray-800 leading-relaxed">
                    {result.isRegenerating ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 w-full rounded bg-gray-200" />
                        <div className="h-4 w-11/12 rounded bg-gray-200" />
                        <div className="h-4 w-5/6 rounded bg-gray-200" />
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
                    {actionButtons.map((button) => (
                      <button
                        key={button.id}
                        type="button"
                        onClick={button.onClick}
                        disabled={result.isRegenerating}
                        className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors ${
                          result.isRegenerating
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {button.icon === 'document' && (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                        {button.icon === 'arrow-left' && (
                          <GrFormPrevious className="h-4 w-4" />
                        )}
                        {button.icon === 'arrow-right' && (
                          <MdNavigateNext className="h-4 w-4" />
                        )}
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 감정 선택 안내 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">
                  AI가 추측한 감정은 {emotion || '감정 선택 안함'}
                  {emotion &&
                    emotionEmojis[emotion as Exclude<EmotionOption, ''>]}
                  입니다.
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                다른 감정을 원하시면 아래에 선택해 주세요
              </p>

              <div className="flex gap-2">
                {emotionButtons
                  .filter(({ emotion: emotionValue }) => emotionValue !== '') // ❓ 버튼 제거
                  .map(({ emotion: emotionValue, emoji, label }) => {
                    const emotionStyle = getEmotionStyle(
                      emotionValue as EmotionOption,
                    );
                    const isSelected = emotion === emotionValue;

                    return (
                      <button
                        key={emotionValue}
                        type="button"
                        onClick={() =>
                          setEmotion(
                            emotion === emotionValue
                              ? ''
                              : (emotionValue as EmotionOption),
                          )
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
                          isSelected && emotionStyle
                            ? `${emotionStyle.bg} ring-2 ${emotionStyle.ring}`
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
          </div>
        </div>

        {/* 하단 고정 입력 영역 */}
        <div className="sticky bottom-0 z-50 border-t border-gray-200 rounded-t-4xl bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-2xl p-4">
            <div className="space-y-3">
              {/* 메인 입력창과 생성 버튼 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={1}
                    placeholder="메시지를 입력하세요..."
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isGenerating && prompt.trim()) {
                          onGenerate();
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={onGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  <div className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl ">
                    <CiLocationArrow1 className="text-sage-100" />
                  </div>
                </button>
              </div>

              {/* 옵션 선택 영역 */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-2">
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as WritingStyle)}
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
                    onChange={(e) => setLength(e.target.value as LengthOption)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    {lengthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 감정 이모지 선택 */}
                <div className="flex gap-1 ml-auto">
                  {Object.entries(emotionEmojis).map(([emotionKey, emoji]) => (
                    <button
                      key={emotionKey}
                      type="button"
                      onClick={() =>
                        setEmotion(
                          emotion === emotionKey
                            ? ''
                            : (emotionKey as EmotionOption),
                        )
                      }
                      className={`h-8 w-8 rounded-full text-sm transition-all ${
                        emotion === emotionKey
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
        </div>
      </div>
    );
  }

  // 초기 상태 - 기존 UI
  return (
    <div className="rounded-3xl bg-ivory-cream shadow-card">
      <div className="p-6 sm:p-8">
        <h1 className="text-4xl font-poetic font-bold text-[#3F764A] text-center">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="text-soft-rose text-3xl">✿</span>
            어떤 글을 만들어드릴까요?
          </span>
        </h1>
        <p className="mt-2 text-body text-text-primary text-center">
          키워드나 짧은 글을 입력하면 AI가 감정적인 글을 생성해 드립니다
        </p>

        <div className="mt-15">
          <label className="sr-only" htmlFor="prompt">
            입력
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="예: 바람, 초록빛 오후, 천천히 걷는 길"
            className="w-full rounded-xl border border-border-subtle bg-white p-4 text-body text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus shadow-card resize-none"
          />
        </div>

        <div className="mt-6 space-y-6">
          {/* 문체와 길이 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-body-small text-text-secondary">
                문체 선택
              </label>
              <Select
                value={style}
                onChange={(v) => setStyle(v as WritingStyle)}
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
                onChange={(v) => setLength(v as LengthOption)}
                options={lengthOptions}
                ariaLabel="길이 선택"
              />
            </div>
          </div>

          {/* 감정 선택 - 이모지 버튼 형태 */}
          <div>
            <label className="mb-3 block text-body-small text-text-secondary">
              감정을 선택해주세요 😊 (선택 사항)
            </label>
            <div className="flex flex-wrap gap-3 justify-center">
              {Object.entries(emotionEmojis).map(([emotionKey, emoji]) => (
                <button
                  key={emotionKey}
                  type="button"
                  onClick={() =>
                    setEmotion(
                      emotion === emotionKey
                        ? ''
                        : (emotionKey as EmotionOption),
                    )
                  }
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl transition-all ${
                    emotion === emotionKey
                      ? 'border-sage-60 bg-sage-50 shadow-md scale-110'
                      : 'border-sage-20 bg-white hover:border-sage-40 hover:bg-sage-10 hover:scale-105'
                  }`}
                  aria-label={`${emotionKey} 선택`}
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
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="mt-8 w-full rounded-xl bg-sage-100 px-6 py-4 text-body-large font-semibold text-text-on-color hover:bg-sage-80 active:bg-sage-80 disabled:opacity-60 transition-colors shadow-card"
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
    </div>
  );
}
