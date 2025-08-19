'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CiLocationArrow1 } from 'react-icons/ci';
import { useRouter } from 'next/navigation';
import { useCreateStore } from '@/stores/create';
import { EmotionOption, useEmotionStore } from '@/stores/emotion';
import { useDiaryStore } from '@/stores/diary';
import { EmotionType } from '@/types';
import PenLoader from '@/components/common/loading';

export default function CreateChat() {
  const [showToast, setShowToast] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    config,
    prompt,
    style,
    length,
    isGenerating,
    chatMessages,
    generateInSession,
    regenerateText,
    deleteMessage,
    navigateRegenerationHistory,
    setPrompt,
    setStyle,
    setLength,
    getStyleDisplayName,
    getLengthDisplayName,
    getAIMessages,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
    getEmotionConfig,
  } = useEmotionStore();

  const { addEntry } = useDiaryStore();

  // 스크롤을 최하단으로 이동
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // 다이어리로 이동 핸들러
  const handleMoveToDiary = useCallback(
    (messageContent: string, messageEmotion?: string) => {
      // 새 다이어리 엔트리 생성
      const newEntry = {
        id: Date.now().toString(),
        title: '', // 제목은 비워두고 사용자가 입력하도록
        content: messageContent,
        userEmotion: messageEmotion as EmotionType, // 감정 정보 전달
        keywords: [], // 키워드는 비워둠
        images: [], // 이미지는 비워둠
        isPublic: false, // 기본적으로 비공개
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 다이어리 스토어에 엔트리 추가
      addEntry(newEntry);

      // 생성된 엔트리의 편집 페이지로 이동
      router.push(`/viewPost/${newEntry.id}`);
    },
    [addEntry, router],
  );

  // 엔터키 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
        e.preventDefault();
        generateInSession(emotion);
        // 메시지 전송 후 이미지 초기화 및 스크롤
        setSelectedImages([]);
        setTimeout(scrollToBottom, 200);
      }
    },
    [isGenerating, prompt, emotion, generateInSession, scrollToBottom],
  );

  // Effects
  useEffect(() => adjustTextareaHeight(), [prompt, adjustTextareaHeight]);

  useEffect(() => {
    if (prompt === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  }, [prompt]);

  // 컴포넌트 언마운트 시 URL 객체 정리
  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        URL.revokeObjectURL(URL.createObjectURL(image));
      });
    };
  }, [selectedImages]);

  return (
    <div className="flex min-h-screen flex-col relative">
      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {getAIMessages().map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {/* 헤더 */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">생성된 글</span>
                </div>
                <div className="flex gap-2">
                  {message.metadata?.emotion &&
                    (() => {
                      const emotionConfig = getEmotionConfig(
                        message.metadata.emotion as EmotionOption,
                      );
                      return (
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            emotionConfig
                              ? `${emotionConfig.styles.bg} ${emotionConfig.styles.text}`
                              : 'bg-sage-30 text-gray-600'
                          }`}
                        >
                          {emotionConfig?.emoji}{' '}
                          {emotionConfig?.label || message.metadata.emotion}
                        </span>
                      );
                    })()}
                  <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                    {getLengthDisplayName(message.metadata?.length || '단문')}
                  </span>
                  <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                    {getStyleDisplayName(message.metadata?.style || '시')}
                  </span>
                </div>
              </div>

              {/* 내용 */}
              <div className="space-y-2 text-gray-800 leading-relaxed">
                {message.metadata?.style === '시'
                  ? message.content
                      .split('\n')
                      .map((line, idx) => <div key={idx}>{line}</div>)
                  : message.content}
              </div>

              {/* 액션 버튼들 */}
              <div className="mt-6 flex gap-2">
                <ActionButton
                  onClick={() => copyToClipboard(message.content)}
                  disabled={isGenerating}
                  text="복사하기"
                />

                <ActionButton
                  onClick={() =>
                    handleMoveToDiary(
                      message.content,
                      message.metadata?.emotion,
                    )
                  }
                  disabled={isGenerating}
                  text="다이어리로 이동"
                />

                {/* 재생성 버튼 그룹 */}
                <div className="flex items-center gap-1">
                  {/* 재생성 */}
                  <ActionButton
                    onClick={() => regenerateText(message.id)}
                    disabled={
                      isGenerating ||
                      (message.regeneration_history &&
                        message.regeneration_history.length >=
                          (message.max_regenerations || 5))
                    }
                    text={
                      message.regeneration_history &&
                      message.regeneration_history.length > 0
                        ? `다시 생성 (${message.regeneration_history.length}/${message.max_regenerations || 5})`
                        : '다시 생성'
                    }
                  />

                  {/* 네비게이션 버튼들 */}
                  {message.regeneration_history &&
                    message.regeneration_history.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            navigateRegenerationHistory(message.id, 'prev')
                          }
                          disabled={
                            !message.current_version ||
                            message.current_version <= 0
                          }
                          className={`w-8 h-8 flex items-center justify-center text-lg transition-all ${
                            !message.current_version ||
                            message.current_version <= 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-sage-100 hover:bg-gray-100 rounded'
                          }`}
                          title="이전 버전"
                        >
                          ‹
                        </button>
                        <span className="text-xs text-gray-500 px-1">
                          {(message.current_version || 0) + 1}/
                          {message.regeneration_history.length}
                        </span>
                        <button
                          onClick={() =>
                            navigateRegenerationHistory(message.id, 'next')
                          }
                          disabled={
                            !message.regeneration_history ||
                            (message.current_version || 0) >=
                              message.regeneration_history.length - 1
                          }
                          className={`w-8 h-8 flex items-center justify-center text-lg transition-all ${
                            !message.regeneration_history ||
                            (message.current_version || 0) >=
                              message.regeneration_history.length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-sage-100 hover:bg-gray-100 rounded'
                          }`}
                          title="다음 버전"
                        >
                          ›
                        </button>
                      </>
                    )}
                </div>
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
            emotionConfigs={emotionConfigs}
            setEmotion={setEmotion}
            getEmotionConfig={getEmotionConfig}
          />

          {/* 스크롤 타겟 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 하단 고정 입력 영역 */}
      <div className="sticky bottom-0 z-50">
        <div className="mx-auto max-w-2xl">
          <div className="border-t border-gray-200 rounded-t-4xl bg-white/95 backdrop-blur-sm shadow-lg p-4 space-y-3">
            {/* 선택된 이미지들 미리보기 */}
            {selectedImages.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`선택된 이미지 ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-sage-30"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedImages.length}/3개 이미지 선택됨
                </p>
              </div>
            )}

            {/* 메인 입력창 */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    adjustTextareaHeight();
                  }}
                  rows={1}
                  placeholder="메시지를 입력하세요..."
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm resize-none min-h-[44px]"
                  style={{ height: 'auto' }}
                  onKeyDown={handleKeyDown}
                />

                {/* 이미지 추가 버튼 - textarea 내부 오른쪽 */}
                {selectedImages.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddImageClick}
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  generateInSession(emotion);
                  // 메시지 전송 후 이미지 초기화 및 스크롤
                  setSelectedImages([]);
                  setTimeout(scrollToBottom, 200);
                }}
                disabled={isGenerating || !prompt.trim()}
                className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl"
              >
                <CiLocationArrow1 className="text-sage-100" />
              </button>
            </div>

            {/* 숨겨진 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* 옵션 선택 */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex gap-2">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {config.styles.map((option) => (
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
                  {config.lengths.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 감정 이모지 */}
              <div className="flex gap-1 ml-auto">
                {emotionConfigs.map(({ value, emoji, styles }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEmotion(emotion === value ? '' : value)}
                    className={`h-8 w-8 rounded-full text-sm transition-all ${
                      emotion === value
                        ? `${styles.bg} ring-2 ${styles.ring} scale-110`
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

// 재사용 가능한 액션 버튼 컴포넌트
const ActionButton = ({
  onClick,
  disabled,
  text,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
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
  emotionConfigs,
  setEmotion,
  getEmotionConfig,
}: any) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-medium">
        AI가 추측한 감정은{' '}
        {emotion
          ? emotionConfigs.find((e: any) => e.value === emotion)?.label ||
            emotion
          : '감정 선택 안함'}
        {emotion && getEmotionConfig(emotion)?.emoji} 입니다.
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      다른 감정을 원하시면 아래에 선택해 주세요
    </p>
    <div className="flex gap-2">
      {emotionConfigs.map(({ value, emoji, label, styles }: any) => {
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
