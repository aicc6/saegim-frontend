'use client';

import { useMemo, useState } from 'react';

type WritingStyle = '시' | '단편글';
type LengthOption = '단문' | '중문' | '장문';
type EmotionOption = '' | '슬픔' | '기쁨' | '분노' | '당황' | '평온';

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
  const [length, setLength] = useState<LengthOption>('중문');
  const [emotion, setEmotion] = useState<EmotionOption>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');

  const emotionBadge = useMemo(() => {
    if (!emotion) return null;
    const map: Record<
      Exclude<EmotionOption, ''>,
      { bg: string; text: string }
    > = {
      기쁨: { bg: 'bg-emotion-happy-bg', text: 'text-emotion-happy' },
      슬픔: { bg: 'bg-emotion-sad-bg', text: 'text-emotion-sad' },
      분노: { bg: 'bg-emotion-angry-bg', text: 'text-emotion-angry' },
      당황: { bg: 'bg-emotion-worried-bg', text: 'text-emotion-worried' },
      평온: { bg: 'bg-emotion-peaceful-bg', text: 'text-emotion-peaceful' },
    };
    return map[emotion];
  }, [emotion]);

  const onGenerate = async () => {
    if (!prompt.trim()) {
      setResult('');
      return;
    }
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 450));
    const text = generateText(prompt, style, length, emotion);
    setResult(text);
    setIsGenerating(false);
  };

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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-body-small text-text-secondary">
              문체 선택
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as WritingStyle)}
              className="w-full rounded-xl border border-border-subtle bg-white p-3 text-body focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="시">시</option>
              <option value="단편글">단편글</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-body-small text-text-secondary">
              길이 선택
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as LengthOption)}
              className="w-full rounded-xl border border-border-subtle bg-white p-3 text-body focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="단문">단문</option>
              <option value="중문">중문</option>
              <option value="장문">장문</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-body-small text-text-secondary">
              감정 선택 (선택 사항)
            </label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value as EmotionOption)}
              className="w-full rounded-xl border border-border-subtle bg-white p-3 text-body focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="">선택 안 함</option>
              <option value="슬픔">슬픔</option>
              <option value="기쁨">기쁨</option>
              <option value="분노">분노</option>
              <option value="당황">당황</option>
              <option value="평온">평온</option>
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="mt-6 w-full rounded-xl bg-sage-50 px-4 py-3 text-body-large font-semibold text-white hover:bg-sage-60 active:bg-sage-70 disabled:opacity-60"
        >
          {isGenerating ? '생성 중...' : '글 생성하기'}
        </button>

        {result && (
          <div className="mt-6 rounded-2xl border border-sage-30 bg-background-secondary p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-body-small text-text-secondary">
                생성된 글
              </span>
              {emotionBadge && (
                <span
                  className={`rounded-full px-3 py-1 text-body-small ${emotionBadge.bg} ${emotionBadge.text}`}
                >
                  {emotion}
                </span>
              )}
            </div>
            <div className={style === '시' ? 'ai-poem' : 'ai-prose'}>
              {style === '시'
                ? result
                    .split('\n')
                    .map((line, idx) => <div key={idx}>{line}</div>)
                : result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
