'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CiLocationArrow1 } from 'react-icons/ci';
import Image from 'next/image';
import {
  useCreateStore,
  WritingStyle,
  LengthOption,
  generateAIText,
} from '@/stores/create';
import {
  EmotionOption,
  useEmotionStore,
  EmotionConfig,
} from '@/stores/emotion';

// 생성된 메시지 타입 정의
interface GeneratedMessage {
  id: string;
  text: string;
  keywords?: string[];
  emotion: EmotionOption;
  style: WritingStyle;
  length: LengthOption;
  regenerationCount: number;
  sessionId?: string;
  prompt: string; // 프롬프트도 저장하여 재생성시 구분
}

// CreateChat 컴포넌트에 sessionId prop 추가
interface CreateChatProps {
  sessionId: string;
}

export default function CreateChat({ sessionId }: CreateChatProps) {
  const [showToast, setShowToast] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 생성된 메시지들을 배열로 관리
  const [generatedMessages, setGeneratedMessages] = useState<
    GeneratedMessage[]
  >([]);

  // 현재 활성화된 sessionId 추적 (재생성용)
  const [currentActiveSessionId, setCurrentActiveSessionId] = useState<
    string | null
  >(null);

  // create.ts store에서 필요한 상태와 함수만 가져오기
  const {
    config,
    prompt,
    style,
    length,
    isGenerating,
    generatedText,
    generatedKeywords,
    setPrompt,
    setStyle,
    setLength,
    generateText,
    getStyleDisplayName,
    getLengthDisplayName,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
    getEmotionConfig,
  } = useEmotionStore();

  // 임시 옵션 상태 (엔터를 눌러야 실제 적용)
  const [tempStyle, setTempStyle] = useState<WritingStyle>(style);
  const [tempLength, setTempLength] = useState<LengthOption>(length);
  const [tempEmotion, setTempEmotion] = useState<EmotionOption>(emotion);

  // 옵션 적용 함수
  const applyOptions = () => {
    setStyle(tempStyle);
    setLength(tempLength);
    setEmotion(tempEmotion);
  };

  // 옵션 적용을 위한 엔터 키 이벤트 핸들러
  const handleOptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyOptions();
    }
  };

  // 임시 상태를 실제 상태와 동기화
  useEffect(() => {
    setTempStyle(style);
    setTempLength(length);
    setTempEmotion(emotion);
  }, [style, length, emotion]);

  // 페이지 이동 시 DB에서 메시지 가져옴
  useEffect(() => {
    const fetchSessionMessages = async () => {
      try {
        // localStorage에서 복원
        const localStorageKey = `ai_messages_${sessionId}`;
        const savedMessages = localStorage.getItem(localStorageKey);

        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages);
            setGeneratedMessages(parsedMessages);
          } catch (parseError) {
            console.error('localStorage 파싱 오류:', parseError);
            localStorage.removeItem(localStorageKey);
          }
        } else {
          console.log('localStorage에 해당 세션의 메시지가 없습니다.');
        }
      } catch (error) {
        console.error('세션 메시지 가져오기 실패:', error);
      }
    };

    if (sessionId) {
      fetchSessionMessages();
    }
  }, [sessionId]);

  // 메시지 상태 변경 시 localStorage에 자동 저장
  useEffect(() => {
    if (generatedMessages.length > 0 && sessionId) {
      const localStorageKey = `ai_messages_${sessionId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(generatedMessages));
    }
  }, [generatedMessages, sessionId]);

  // 새 메시지 생성 완료 시 처리
  useEffect(() => {
    if (generatedText && !isGenerating) {
      const newMessage: GeneratedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: generatedText,
        keywords: generatedKeywords || [],
        emotion,
        style,
        length,
        regenerationCount: 1, // 새 메시지는 1번째 생성
        sessionId: currentActiveSessionId || '', // 현재 활성화된 sessionId 사용
        prompt: prompt, // 현재 프롬프트 저장
      };

      // 새 메시지는 항상 배열에 추가
      setGeneratedMessages((prev) => [...prev, newMessage]);
    }
  }, [
    generatedText,
    generatedKeywords,
    emotion,
    style,
    length,
    currentActiveSessionId,
    isGenerating,
    prompt,
  ]);

  // 새 글 생성 핸들러 (새로운 sessionId 생성)
  const handleNewGeneration = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    try {
      // 새로운 sessionId 생성
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentActiveSessionId(newSessionId);

      console.log('새 글 생성 - 새로운 sessionId:', newSessionId);

      // generateAIText를 직접 호출 (sessionId 없이 - 백엔드에서 새로 생성)
      const response = await generateAIText({
        prompt: prompt.trim(),
        style,
        length,
        emotion,
        regeneration_count: 1,
        // sessionId 전달하지 않음 - 백엔드에서 새로 생성
      });

      // 생성된 sessionId로 업데이트
      setCurrentActiveSessionId(response.session_id);

      const newMessage: GeneratedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: response.ai_generated_text,
        keywords: response.keywords || [],
        emotion: response.ai_emotion as EmotionOption,
        style,
        length,
        regenerationCount: 1,
        sessionId: response.session_id,
        prompt: prompt.trim(),
      };

      setGeneratedMessages((prev) => [...prev, newMessage]);

      // 메시지 전송 후 처리
      setSelectedImages([]);
      setPrompt('');
      setTimeout(scrollToBottom, 200);
    } catch (error) {
      console.error('💥 새 글 생성 실패:', error);
    }
  }, [prompt, emotion, isGenerating, style, length]);

  // 재생성 핸들러 (기존 sessionId 사용)
  const handleRegenerate = useCallback(
    async (
      messageSessionId: string,
      messagePrompt: string,
      messageEmotion: EmotionOption,
      messageStyle: WritingStyle,
      messageLength: LengthOption,
    ) => {
      if (!messagePrompt.trim() || isGenerating) return;

      try {
        console.log('재생성 - 기존 sessionId 사용:', messageSessionId);

        // 해당 sessionId의 메시지들 찾기
        const messagesWithSameSession = generatedMessages.filter(
          (msg) => msg.sessionId === messageSessionId,
        );

        const currentRegenerationCount =
          messagesWithSameSession.length > 0
            ? Math.max(
                ...messagesWithSameSession.map((m) => m.regenerationCount),
              )
            : 0;

        const newCount = currentRegenerationCount + 1;

        // 재생성 횟수 제한 (최대 5번)
        if (newCount > 5) {
          alert('재생성은 최대 5번까지만 가능합니다.');
          return;
        }

        // generateAIText를 직접 호출하여 regeneration_count 전달
        const response = await generateAIText({
          prompt: messagePrompt,
          style: messageStyle,
          length: messageLength,
          emotion: messageEmotion,
          regeneration_count: newCount,
          sessionId: messageSessionId, // 재생성 시에는 기존 sessionId 사용
        });

        // 같은 session_id를 가진 가장 최근 메시지를 찾아서 업데이트
        setGeneratedMessages((prev) => {
          const latestMessageIndex = prev.findIndex(
            (msg) =>
              msg.sessionId === messageSessionId &&
              msg.regenerationCount === currentRegenerationCount,
          );

          if (latestMessageIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[latestMessageIndex] = {
              ...updatedMessages[latestMessageIndex],
              text: response.ai_generated_text,
              regenerationCount: newCount,
            };
            return updatedMessages;
          } else {
            // 기존 메시지가 없으면 새로 추가
            const newMessage: GeneratedMessage = {
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: response.ai_generated_text,
              keywords: response.keywords || [],
              emotion: response.ai_emotion as EmotionOption,
              style: messageStyle,
              length: messageLength,
              regenerationCount: newCount,
              sessionId: messageSessionId,
              prompt: messagePrompt,
            };
            return [...prev, newMessage];
          }
        });
      } catch (error) {
        console.error('💥 재생성 실패:', error);
      }
    },
    [isGenerating, generatedMessages],
  );

  // 다이어리로 이동 핸들러 (간단한 alert로 처리)
  const handleMoveToDiary = useCallback(
    (messageContent: string, messageEmotion?: string) => {
      alert(
        `다이어리로 이동 기능은 아직 구현되지 않았습니다.\n\n생성된 텍스트: ${messageContent.substring(0, 100)}...`,
      );
    },
    [],
  );

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

  // 엔터키 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
        e.preventDefault();
        // 임시 옵션들을 실제 옵션으로 적용
        applyOptions();
        // 새 글 생성
        handleNewGeneration();
      }
    },
    [isGenerating, prompt, handleNewGeneration],
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
          {/* 생성된 메시지들 표시 */}
          {generatedMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {/* 헤더 */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">생성된 글</span>
                  <span className="text-xs text-gray-400">
                    (세션: {message.sessionId?.substring(0, 8)}...)
                  </span>
                </div>
                <div className="flex gap-2">
                  {message.emotion &&
                    (() => {
                      const emotionConfig = getEmotionConfig(message.emotion);
                      return (
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            emotionConfig
                              ? `${emotionConfig.styles.bg} ${emotionConfig.styles.text}`
                              : 'bg-sage-30 text-gray-600'
                          }`}
                        >
                          {emotionConfig?.emoji}{' '}
                          {emotionConfig?.label || message.emotion}
                        </span>
                      );
                    })()}
                  <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                    {getLengthDisplayName(message.length)}
                  </span>
                  <span className="rounded-full bg-sage-30 px-2 py-1 text-xs text-gray-600">
                    {getStyleDisplayName(message.style)}
                  </span>
                </div>
              </div>

              {/* 내용 */}
              <div className="space-y-2 text-gray-800 leading-relaxed">
                {message.style === 'poem'
                  ? message.text
                      .split('\n')
                      .map((line, idx) => <div key={idx}>{line}</div>)
                  : message.text}
              </div>

              {/* 키워드 표시 */}
              {message.keywords && message.keywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">추출된 키워드:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.keywords.map((keyword, index) => (
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
                  onClick={() => copyToClipboard(message.text)}
                  disabled={isGenerating}
                  text="복사하기"
                />

                <ActionButton
                  onClick={() =>
                    handleMoveToDiary(message.text, message.emotion)
                  }
                  disabled={isGenerating}
                  text="다이어리로 이동"
                />

                {/* 재생성 버튼 - 각 메시지별로 개별 처리 */}
                <ActionButton
                  onClick={() =>
                    handleRegenerate(
                      message.sessionId || '',
                      message.prompt,
                      message.emotion,
                      message.style,
                      message.length,
                    )
                  }
                  disabled={isGenerating}
                  text={
                    message.regenerationCount === 1
                      ? '다시 생성'
                      : `다시 생성 (${message.regenerationCount}번)`
                  }
                />
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {/* 새 글 작성 버튼 */}
              <button
                onClick={handleNewGeneration}
                disabled={isGenerating || !prompt.trim()}
                className="flex hover:bg-sage-50 h-12 w-12 items-center justify-center rounded-2xl bg-sage-40 transition-colors text-2xl"
                title="새 글 작성"
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
interface EmotionGuideProps {
  emotion: EmotionOption;
  emotionConfigs: EmotionConfig[];
  setEmotion: (emotion: EmotionOption) => void;
  getEmotionConfig: (emotion: EmotionOption) => EmotionConfig | undefined;
}

const EmotionGuide = ({
  emotion,
  emotionConfigs,
  setEmotion,
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
