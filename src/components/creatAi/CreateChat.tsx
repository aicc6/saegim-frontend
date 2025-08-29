'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CiLocationArrow1 } from 'react-icons/ci';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCreateStore, WritingStyle, LengthOption } from '@/stores/create';
import {
  EmotionOption,
  useEmotionStore,
  EmotionConfig,
} from '@/stores/emotion';
import { getLogger } from '@/lib/logger';
import { diaryApi, aiApi, ApiResponse } from '@/lib/api';
import { DiaryEntry } from '@/types/diary';

const logger = getLogger('CreateChat');

// 타입 정의
interface MessageVersion {
  id: string;
  text: string;
  keywords?: string[];
  emotion: EmotionOption;
  style: WritingStyle;
  length: LengthOption;
  regenerationCount: number;
  createdAt: Date;
  images?: File[];
  userPrompt: string; // 사용자 원본 프롬프트 저장
}

interface GeneratedMessage {
  id: string;
  sessionId?: string;
  versions: MessageVersion[];
  currentVersionIndex: number;
}

interface RegenerateResponse {
  ai_generated_text: string;
  keywords?: string[];
  ai_emotion: string;
  style?: WritingStyle;
  length?: LengthOption;
  user_prompt?: string;
}

interface CreateChatProps {
  sessionId: string;
}

interface StoredMessage {
  id: string;
  sessionId?: string;
  versions: StoredMessageVersion[];
  currentVersionIndex: number;
}

interface StoredMessageVersion {
  id: string;
  text: string;
  keywords?: string[];
  emotion: EmotionOption;
  style: WritingStyle;
  length: LengthOption;
  regenerationCount: number;
  createdAt: string; // ISO string for localStorage
  images?: File[];
  userPrompt: string; // 사용자 원본 프롬프트 저장
}

export default function CreateChat({ sessionId }: CreateChatProps) {
  // 상태 정의
  const [showToast, setShowToast] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<
    GeneratedMessage[]
  >([]);
  const [regeneratingMessageIds, setRegeneratingMessageIds] = useState<
    Set<string>
  >(new Set());

  // refs
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // store 상태
  const {
    config,
    prompt,
    originalPrompt,
    style,
    length,
    isGenerating,
    generatedText,
    generatedKeywords,
    sessionId: storeSessionId,
    wasJustGenerated,
    setPrompt,
    setStyle,
    setLength,
    generateText,
    clearGeneratedText,
    getStyleDisplayName,
    getLengthDisplayName,
    markAsProcessed,
    restoreOriginalInput,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
    getEmotionConfig,
  } = useEmotionStore();

  // 임시 옵션 상태
  const [tempStyle, setTempStyle] = useState<WritingStyle>(style);
  const [tempLength, setTempLength] = useState<LengthOption>(length);
  const [tempEmotion, setTempEmotion] = useState<EmotionOption>(emotion);

  // 유틸리티 함수들
  const generateId = (): string =>
    `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const applyOptions = useCallback((): void => {
    setStyle(tempStyle);
    setLength(tempLength);
    setEmotion(tempEmotion);
  }, [tempStyle, tempLength, tempEmotion, setStyle, setLength, setEmotion]);

  const scrollToBottom = useCallback((): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const adjustTextareaHeight = useCallback((): void => {
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

  const copyToClipboard = useCallback(
    async (content: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(content);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (error) {
        logger.error('클립보드 복사 실패', { error });
      }
    },
    [],
  );

  // 이벤트 핸들러들
  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files;
      if (!files) return;

      const newImages = Array.from(files).filter(
        (file) =>
          file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024,
      );
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 3));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [],
  );

  const handleImageRemove = useCallback((index: number): void => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddImageClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleMoveToDiary = useCallback(
    async (
      messageContent: string,
      messageEmotion?: string,
      messageKeywords?: string[],
    ): Promise<void> => {
      try {
        if (!originalPrompt.trim()) {
          alert('사용자 입력이 없어 다이어리를 저장할 수 없습니다.');
          return;
        }

        const response = (await diaryApi.createDiary({
          content: originalPrompt.trim(),
          user_emotion: emotion || undefined,
          ai_generated_text: messageContent,
          ai_emotion: messageEmotion || undefined,
          ai_emotion_confidence: 0.8,
          keywords: messageKeywords || [],
          is_public: false,
        })) as ApiResponse<DiaryEntry>;

        router.push(`/viewPost/${response.data.id}`);
      } catch (error) {
        logger.error('다이어리 저장 실패:', error);
        alert('다이어리 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    },
    [originalPrompt, emotion, router],
  );

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyOptions();
      }
    },
    [applyOptions],
  );

  const handleGenerate = useCallback((): void => {
    applyOptions();
    generateText(tempEmotion);
    setSelectedImages([]);
    setPrompt('');
    clearGeneratedText(); // 기존 generatedText 초기화
    setTimeout(scrollToBottom, 200);
  }, [
    tempEmotion,
    generateText,
    scrollToBottom,
    setPrompt,
    applyOptions,
    clearGeneratedText,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [isGenerating, prompt, handleGenerate],
  );

  // 재생성 핸들러
  const handleRegenerate = useCallback(
    async (message?: GeneratedMessage): Promise<void> => {
      if (isGenerating) return;

      if (message && message.versions.length >= 5) {
        alert('재생성 횟수가 5회에 도달했습니다.');
        return;
      }

      try {
        const targetSessionId = message?.sessionId || sessionId;
        const response = (await aiApi.regenerate(
          targetSessionId,
        )) as ApiResponse<RegenerateResponse>;
        const responseData = response.data;

        setGeneratedMessages((prev) => {
          const messageIndex = prev.findIndex(
            (msg) => msg.sessionId === targetSessionId,
          );

          const newCount = (message?.versions.length || 0) + 1;
          const newVersion: MessageVersion = {
            id: `version_${generateId()}`,
            text: responseData.ai_generated_text,
            keywords: responseData.keywords || [],
            emotion: responseData.ai_emotion as EmotionOption,
            style: responseData.style || style,
            length: responseData.length || length,
            regenerationCount: newCount,
            createdAt: new Date(),
            images: message?.versions[message.currentVersionIndex]?.images,
            userPrompt: responseData.user_prompt || '',
          };

          if (messageIndex === -1) {
            const newMessage: GeneratedMessage = {
              id: `msg_${generateId()}`,
              sessionId: targetSessionId,
              versions: [newVersion],
              currentVersionIndex: 0,
            };
            return [...prev, newMessage];
          } else {
            const updatedMessages = [...prev];
            const existingMessage = updatedMessages[messageIndex];
            updatedMessages[messageIndex] = {
              ...existingMessage,
              versions: [...existingMessage.versions, newVersion],
              currentVersionIndex: existingMessage.versions.length,
            };
            return updatedMessages;
          }
        });

        // 재생성 후 generatedText 초기화
        clearGeneratedText();
      } catch (error) {
        logger.error('재생성 실패', { error });
      }
    },
    [isGenerating, style, length, sessionId],
  );

  // 버전 네비게이션 핸들러
  const handlePreviousVersion = useCallback((messageId: string): void => {
    setGeneratedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              currentVersionIndex: Math.max(0, msg.currentVersionIndex - 1),
            }
          : msg,
      ),
    );
  }, []);

  const handleNextVersion = useCallback((messageId: string): void => {
    setGeneratedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              currentVersionIndex: Math.min(
                msg.versions.length - 1,
                msg.currentVersionIndex + 1,
              ),
            }
          : msg,
      ),
    );
  }, []);

  // localStorage 유틸리티 함수들
  const saveMessagesToLocalStorage = useCallback(
    (messages: GeneratedMessage[], sessionId: string): void => {
      try {
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        const messagesForStorage: StoredMessage[] = messages.map((msg) => ({
          ...msg,
          versions: msg.versions.map((version) => ({
            ...version,
            createdAt: version.createdAt.toISOString(),
          })),
        }));
        localStorage.setItem(
          localStorageKey,
          JSON.stringify(messagesForStorage),
        );
      } catch (error) {
        logger.error('localStorage 저장 실패', { error });
      }
    },
    [],
  );

  const loadMessagesFromLocalStorage = useCallback(
    (sessionId: string): GeneratedMessage[] => {
      try {
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        const savedMessages = localStorage.getItem(localStorageKey);

        if (!savedMessages) return [];

        const parsedMessages: StoredMessage[] = JSON.parse(savedMessages);
        return parsedMessages.map((msg) => ({
          ...msg,
          versions: msg.versions.map((version) => ({
            ...version,
            createdAt: new Date(version.createdAt),
            userPrompt: version.userPrompt || '',
          })),
        }));
      } catch (error) {
        logger.error('localStorage 파싱 오류', { error });
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        localStorage.removeItem(localStorageKey);
        return [];
      }
    },
    [],
  );

  // Effects
  useEffect(() => {
    setTempStyle(style);
    setTempLength(length);
    setTempEmotion(emotion);
  }, [style, length, emotion]);

  useEffect(() => {
    const fetchSessionMessages = (): void => {
      if (sessionId) {
        const messages = loadMessagesFromLocalStorage(sessionId);
        setGeneratedMessages(messages);
      }
    };

    fetchSessionMessages();
  }, [sessionId, loadMessagesFromLocalStorage]);

  useEffect(() => {
    if (generatedMessages.length > 0 && sessionId) {
      saveMessagesToLocalStorage(generatedMessages, sessionId);
    }
  }, [generatedMessages, sessionId, saveMessagesToLocalStorage]);

  useEffect(() => {
    if (generatedText && !isGenerating && wasJustGenerated) {
      const newVersion: MessageVersion = {
        id: `version_${generateId()}`,
        text: generatedText,
        keywords: generatedKeywords || [],
        emotion,
        style,
        length,
        regenerationCount: 1,
        createdAt: new Date(),
        images: selectedImages.length > 0 ? [...selectedImages] : undefined,
        userPrompt: originalPrompt || prompt.trim(),
      };

      const newMessage: GeneratedMessage = {
        id: `msg_${generateId()}`,
        sessionId: storeSessionId || sessionId, // storeSessionId가 없으면 props의 sessionId 사용
        versions: [newVersion],
        currentVersionIndex: 0,
      };

      setGeneratedMessages((prev) => [...prev, newMessage]);
      markAsProcessed(); // 처리 완료 마킹
    }
  }, [
    generatedText,
    generatedKeywords,
    emotion,
    style,
    length,
    sessionId,
    storeSessionId,
    isGenerating,
    wasJustGenerated,
    markAsProcessed,
    prompt,
    selectedImages,
    originalPrompt,
  ]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, adjustTextareaHeight]);

  // 페이지 로드 시 originalPrompt 복구
  useEffect(() => {
    if (storeSessionId && !originalPrompt && generatedText) {
      restoreOriginalInput();
    }
  }, [storeSessionId, originalPrompt, generatedText, restoreOriginalInput]);

  useEffect(() => {
    if (prompt === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  }, [prompt]);

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
          {/* 생성된 메시지들 표시 */}
          {generatedMessages.map((message) => {
            const currentVersion =
              message.versions[message.currentVersionIndex];
            const hasMultipleVersions = message.versions.length > 1;

            return (
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
                    {currentVersion.emotion &&
                      (() => {
                        const emotionConfig = getEmotionConfig(
                          currentVersion.emotion,
                        );
                        return (
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              // 재생성 감정 색상 변경 추후 수정
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
                      onClick={() => handlePreviousVersion(message.id)}
                      disabled={message.currentVersionIndex === 0}
                      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
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
                      {message.currentVersionIndex + 1} /{' '}
                      {message.versions.length}
                    </span>

                    <button
                      onClick={() => handleNextVersion(message.id)}
                      disabled={
                        message.currentVersionIndex ===
                        message.versions.length - 1
                      }
                      className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 "
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
                {regeneratingMessageIds.has(message.id) ? (
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
                ) : (
                  <div className="space-y-2 text-gray-800 leading-relaxed">
                    {currentVersion.style === 'poem'
                      ? currentVersion.text
                          .split('\n')
                          .map((line: string, idx: number) => (
                            <div key={idx}>{line}</div>
                          ))
                      : currentVersion.text}
                  </div>
                )}

                {/* 키워드 표시 */}
                {!regeneratingMessageIds.has(message.id) &&
                  currentVersion.keywords &&
                  currentVersion.keywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">
                        추출된 키워드:
                      </p>
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
                    onClick={() => copyToClipboard(currentVersion.text)}
                    disabled={
                      isGenerating || regeneratingMessageIds.has(message.id)
                    }
                    text="복사하기"
                  />

                  <ActionButton
                    onClick={() =>
                      handleMoveToDiary(
                        currentVersion.text,
                        currentVersion.emotion,
                        currentVersion.keywords,
                      )
                    }
                    disabled={
                      isGenerating || regeneratingMessageIds.has(message.id)
                    }
                    text="다이어리로 이동"
                  />

                  <ActionButton
                    onClick={() => handleRegenerate(message)}
                    disabled={
                      isGenerating ||
                      regeneratingMessageIds.has(message.id) ||
                      message.versions.length >= 5
                    }
                    text={
                      regeneratingMessageIds.has(message.id)
                        ? '재생성 중...'
                        : message.versions.length === 1
                          ? '다시 생성'
                          : message.versions.length >= 5
                            ? `최대 재생성 횟수 도달 (${message.versions.length}번)`
                            : `다시 생성 (${message.versions.length}번)`
                    }
                    className={
                      message.versions.length >= 5
                        ? 'text-gray-400  opacity-50'
                        : ''
                    }
                  />
                </div>
              </div>
            );
          })}

          {/* 로딩 상태 */}
          {isGenerating && (
            <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
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
          )}

          {/* 감정 선택 안내 */}
          <EmotionGuide
            emotion={emotion}
            emotionConfigs={emotionConfigs}
            setEmotion={setEmotion}
            getEmotionConfig={getEmotionConfig}
          />

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
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`선택된 이미지 ${index + 1}`}
                        width={64}
                        height={64}
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
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl"
              >
                <CiLocationArrow1 className="text-sage-100" />
              </button>
            </div>

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
                  value={tempStyle}
                  onChange={(e) => setTempStyle(e.target.value as WritingStyle)}
                  onKeyDown={handleOptionKeyDown}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {config.styles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={tempLength}
                  onChange={(e) =>
                    setTempLength(e.target.value as LengthOption)
                  }
                  onKeyDown={handleOptionKeyDown}
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
                    onClick={() =>
                      setTempEmotion(tempEmotion === value ? '' : value)
                    }
                    onKeyDown={handleOptionKeyDown}
                    className={`h-8 w-8 rounded-full text-sm transition-all ${
                      tempEmotion === value
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
interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  text: string;
  icon?: React.ReactNode;
  className?: string;
}

const ActionButton = ({
  onClick,
  disabled = false,
  text,
  icon,
  className = '',
}: ActionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors ${
      disabled ? 'text-gray-400 ' : 'text-gray-700 hover:bg-gray-50'
    } ${className}`}
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
interface EmotionGuideProps {
  emotion: EmotionOption;
  emotionConfigs: EmotionConfig[];
  setEmotion: (emotion: EmotionOption) => void;
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
}

const EmotionGuide = ({
  emotion,
  emotionConfigs,

  getEmotionConfig,
}: EmotionGuideProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-medium">
        AI가 추측한 감정은{' '}
        {emotion
          ? emotionConfigs.find((e) => e.value === emotion)?.label || emotion
          : '감정 선택 안함'}
        {emotion && getEmotionConfig(emotion)?.emoji} 입니다.
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      다른 감정을 원하시면 아래에 선택해 주세요
    </p>
  </div>
);
