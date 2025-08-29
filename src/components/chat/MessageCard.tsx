import Image from 'next/image';
import { GeneratedMessage } from '@/types/chat';
import { EmotionOption, EmotionConfig } from '@/stores/emotion';
import { WritingStyle, LengthOption } from '@/stores/create';
import { ActionButton } from './ActionButton';

interface MessageCardProps {
  message: GeneratedMessage;
  isRegenerating: boolean;
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
  onCopy: (content: string) => void;
  onMoveToDiary: (
    content: string,
    emotion?: string,
    keywords?: string[],
  ) => void;
  onRegenerate: (message: GeneratedMessage) => void;
  onPreviousVersion: (messageId: string) => void;
  onNextVersion: (messageId: string) => void;
}

export const MessageCard = ({
  message,
  isRegenerating,
  getEmotionConfig,
  getStyleDisplayName,
  getLengthDisplayName,
  onCopy,
  onMoveToDiary,
  onRegenerate,
  onPreviousVersion,
  onNextVersion,
}: MessageCardProps) => {
  const currentVersion = message.versions[message.currentVersionIndex];
  const hasMultipleVersions = message.versions.length > 1;

  if (isRegenerating) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3 animate-pulse">
          {[40, 100, 90, 80].map((width, idx) => (
            <div
              key={idx}
              className={`h-4 rounded bg-gray-200 ${
                width === 40
                  ? 'w-2/5'
                  : width === 100
                    ? 'w-full'
                    : width === 90
                      ? 'w-11/12'
                      : 'w-5/6'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">생성된 글</span>
        </div>
        <div className="flex gap-2">
          {currentVersion.emotion &&
            (() => {
              const emotionConfig = getEmotionConfig(currentVersion.emotion);
              return (
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    emotionConfig
                      ? `${emotionConfig.styles.bg} ${emotionConfig.styles.text}`
                      : 'bg-sage-30 text-gray-600'
                  }`}
                >
                  {emotionConfig?.emoji}{' '}
                  {emotionConfig?.label || currentVersion.emotion}
                </span>
              );
            })()}
          <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
            {getLengthDisplayName(currentVersion.length)}
          </span>
          <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
            {getStyleDisplayName(currentVersion.style)}
          </span>
        </div>
      </div>

      {/* 버전 네비게이션 */}
      {hasMultipleVersions && (
        <div className="mb-4 flex items-center justify-center gap-2">
          <button
            onClick={() => onPreviousVersion(message.id)}
            disabled={message.currentVersionIndex === 0}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-sm text-gray-500">
            {message.currentVersionIndex + 1} / {message.versions.length}
          </span>

          <button
            onClick={() => onNextVersion(message.id)}
            disabled={
              message.currentVersionIndex === message.versions.length - 1
            }
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* 이미지 표시 */}
      {currentVersion.images && currentVersion.images.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {currentVersion.images.map((image, index) => (
              <div key={index} className="relative">
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`업로드된 이미지 ${index + 1}`}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내용 */}
      <div className="space-y-2 text-gray-800 leading-relaxed">
        {currentVersion.style === 'poem'
          ? currentVersion.text
              .split('\n')
              .map((line: string, idx: number) => <div key={idx}>{line}</div>)
          : currentVersion.text}
      </div>

      {/* 키워드 표시 */}
      {currentVersion.keywords && currentVersion.keywords.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">추출된 키워드:</p>
          <div className="flex flex-wrap gap-2">
            {currentVersion.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-sage-20 text-sage-80 text-xs rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="mt-6 flex gap-2">
        <ActionButton
          onClick={() => onCopy(currentVersion.text)}
          disabled={false}
          text="복사하기"
        />

        <ActionButton
          onClick={() =>
            onMoveToDiary(
              currentVersion.text,
              currentVersion.emotion,
              currentVersion.keywords,
            )
          }
          disabled={false}
          text="다이어리로 이동"
        />

        <ActionButton
          onClick={() => onRegenerate(message)}
          disabled={message.versions.length >= 5}
          text={
            message.versions.length === 1
              ? '다시 생성'
              : message.versions.length >= 5
                ? `최대 재생성 횟수 도달 (${message.versions.length}번)`
                : `다시 생성 (${message.versions.length}번)`
          }
          className={
            message.versions.length >= 5 ? 'text-gray-400 opacity-50' : ''
          }
        />
      </div>
    </div>
  );
};
