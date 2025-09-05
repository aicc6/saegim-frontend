import { CiLocationArrow1 } from 'react-icons/ci';
import type { RefObject, KeyboardEvent } from 'react';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { TimePicker } from '@/components/ui/custom/TimePicker';

interface ChatInputProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  prompt: string;
  isGenerating: boolean;
  selectedImages: File[];
  onPromptChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onGenerate: () => void;
  onAddImageClick: () => void;
  adjustTextareaHeight: () => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
  onConfirmDateTime?: () => void;
}

export const ChatInput = ({
  textareaRef,
  prompt,
  isGenerating,
  selectedImages,
  onPromptChange,
  onKeyDown,
  onGenerate,
  onAddImageClick,
  adjustTextareaHeight,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  onConfirmDateTime,
}: ChatInputProps) => {
  const isDarkMode = useDarkMode();
  const isPastOrNotToday = (() => {
    if (!selectedDate) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate < todayStr; // 과거 날짜에서만 시간 노출
  })();
  return (
    <div className="space-y-3">
      {/* 메시지 입력란 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value);
              adjustTextareaHeight();
            }}
            rows={1}
            placeholder="메시지를 입력하세요..."
            className={`w-full rounded-2xl border border-gray-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'} px-4 py-3 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm resize-none min-h-[44px]`}
            onKeyDown={onKeyDown}
          />

          {selectedImages.length < 3 && (
            <button
              type="button"
              onClick={onAddImageClick}
              className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="이미지 추가"
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl disabled:opacity-50"
        >
          <CiLocationArrow1 className="text-sage-100" />
        </button>
      </div>

      {/* 날짜 선택 */}
      {onDateChange && (
        <div className="flex items-center gap-3 flex-wrap">
          <label
            htmlFor="date-picker"
            className="text-sm text-gray-600 font-medium"
          >
            날짜 선택:
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate || ''}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {isPastOrNotToday && onTimeChange && (
            <>
              <span className="text-sm text-gray-600 font-medium">
                시간 선택:
              </span>
              <TimePicker
                value={selectedTime || '11:00'}
                onChange={onTimeChange}
                onConfirm={onConfirmDateTime}
                dark={isDarkMode}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
