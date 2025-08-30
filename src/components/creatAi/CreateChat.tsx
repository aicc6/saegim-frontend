'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateStore,
  type WritingStyle,
  type LengthOption,
} from '@/stores/create';
import { useEmotionStore } from '@/stores/emotion';
import { useMessageManagement } from '@/hooks/use-message-management';
import { useImageHandler } from '@/hooks/use-image-handler';
import { useChatGeneration } from '@/hooks/use-chat-generation';
import { useTempOptions } from '@/hooks/use-temp-options';
import { useChatUi } from '@/hooks/use-chat-ui';
import { useClipboard } from '@/hooks/use-clipboard';
import { useSimpleToast } from '@/hooks/use-simple-toast';
import { MessageCard } from '@/components/chat/MessageCard';
import { LoadingMessage } from '@/components/chat/LoadingMessage';
import { EmotionGuide } from '@/components/chat/EmotionGuide';
import { ImagePreview } from '@/components/chat/ImagePreview';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatOptions } from '@/components/chat/ChatOptions';
import { Toast } from '@/components/chat/Toast';

interface CreateChatProps {
  sessionId: string;
}

export default function CreateChat({ sessionId }: CreateChatProps) {
  const _router = useRouter();

  // Store 상태
  const {
    config,
    prompt,
    style,
    length,
    isGenerating,
    setPrompt,
    setStyle,
    setLength,
    setEmotion,
    getStyleDisplayName,
    getLengthDisplayName,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    getEmotionConfig,
  } = useEmotionStore();

  // 커스텀 훅들
  const {
    generatedMessages,
    regeneratingMessageIds,
    addVersionToMessage,
    handlePreviousVersion,
    handleNextVersion,
    generateId,
  } = useMessageManagement(sessionId);

  const {
    selectedImages,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    handleAddImageClick,
    clearImages,
  } = useImageHandler(3);

  const { handleGenerate, handleRegenerate, handleMoveToDiary } =
    useChatGeneration(sessionId, addVersionToMessage, generateId);

  const { showToast, showToastMessage } = useSimpleToast();

  const { copyToClipboard } = useClipboard(showToastMessage);

  const { textareaRef, messagesEndRef, scrollToBottom, adjustTextareaHeight } =
    useChatUi(prompt);

  const onApplyOptions = useCallback(
    (tempStyle: string, tempLength: string, tempEmotion: string) => {
      setStyle(tempStyle as WritingStyle);
      setLength(tempLength as LengthOption);
      setEmotion(tempEmotion);
    },
    [setStyle, setLength, setEmotion],
  );

  const {
    tempStyle,
    tempLength,
    tempEmotion,
    setTempStyle,
    setTempLength,
    setTempEmotion,
    handleOptionKeyDown,
  } = useTempOptions({
    initialStyle: style,
    initialLength: length,
    initialEmotion: emotion,
    onApply: onApplyOptions,
  });

  // 이벤트 핸들러들
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
        e.preventDefault();
        handleGenerate(
          tempEmotion,
          tempStyle,
          tempLength,
          selectedImages,
          clearImages,
        );
        setTimeout(scrollToBottom, 200);
      }
    },
    [
      isGenerating,
      prompt,
      handleGenerate,
      tempEmotion,
      tempStyle,
      tempLength,
      selectedImages,
      clearImages,
      scrollToBottom,
    ],
  );

  const handleGenerateClick = useCallback((): void => {
    handleGenerate(
      tempEmotion,
      tempStyle,
      tempLength,
      selectedImages,
      clearImages,
    );
    setTimeout(scrollToBottom, 200);
  }, [
    handleGenerate,
    tempEmotion,
    tempStyle,
    tempLength,
    selectedImages,
    clearImages,
    scrollToBottom,
  ]);

  return (
    <div className="flex min-h-screen flex-col relative">
      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* 생성된 메시지들 표시 */}
          {generatedMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              isRegenerating={regeneratingMessageIds.has(message.id)}
              getEmotionConfig={getEmotionConfig}
              getStyleDisplayName={getStyleDisplayName}
              getLengthDisplayName={getLengthDisplayName}
              onCopy={copyToClipboard}
              onMoveToDiary={handleMoveToDiary}
              onRegenerate={handleRegenerate}
              onPreviousVersion={handlePreviousVersion}
              onNextVersion={handleNextVersion}
            />
          ))}

          {/* 로딩 상태 */}
          {isGenerating && <LoadingMessage />}

          {/* 감정 선택 안내 */}
          <EmotionGuide
            emotion={emotion}
            emotionConfigs={emotionConfigs}
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
            <ImagePreview
              selectedImages={selectedImages}
              onRemove={handleImageRemove}
            />

            {/* 메인 입력창 */}
            <ChatInput
              textareaRef={textareaRef}
              prompt={prompt}
              isGenerating={isGenerating}
              selectedImages={selectedImages}
              onPromptChange={setPrompt}
              onKeyDown={handleKeyDown}
              onGenerate={handleGenerateClick}
              onAddImageClick={handleAddImageClick}
              adjustTextareaHeight={adjustTextareaHeight}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* 옵션 선택 */}
            <ChatOptions
              config={config}
              emotionConfigs={emotionConfigs}
              tempStyle={tempStyle}
              tempLength={tempLength}
              tempEmotion={tempEmotion}
              onStyleChange={setTempStyle}
              onLengthChange={setTempLength}
              onEmotionChange={setTempEmotion}
              onKeyDown={handleOptionKeyDown}
            />
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <Toast show={showToast} message="복사되었습니다" />
    </div>
  );
}
