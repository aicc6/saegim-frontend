import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateStore, WritingStyle, LengthOption } from '@/stores/create';
import { EmotionOption, useEmotionStore } from '@/stores/emotion';
import { MessageVersion, RegenerateResponse } from '@/types/chat';
import { diaryApi, aiApi, ApiResponse } from '@/lib/api';
import { DiaryEntry } from '@/types/diary';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useChatGeneration');

export const useChatGeneration = (
  sessionId: string,
  addVersionToMessage: (sessionId: string, version: MessageVersion) => void,
  generateId: () => string,
) => {
  const router = useRouter();

  const {
    config,
    prompt,
    originalPrompt,
    style,
    length,
    isGenerating,
    generatedText,
    generatedKeywords,
    sessionId: _storeSessionId,
    wasJustGenerated,
    setPrompt,
    setStyle,
    setLength,
    generateText,
    clearGeneratedText,
    getStyleDisplayName,
    getLengthDisplayName,
    markAsProcessed,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    setSelectedEmotion: setEmotion,
    getEmotionConfig,
  } = useEmotionStore();

  const handleGenerate = useCallback(
    (
      tempEmotion: EmotionOption,
      tempStyle: WritingStyle,
      tempLength: LengthOption,
      selectedImages: File[],
      clearImages: () => void,
    ): void => {
      setStyle(tempStyle);
      setLength(tempLength);
      setEmotion(tempEmotion);
      generateText(tempEmotion);
      clearImages();
      setPrompt('');
      clearGeneratedText();
    },
    [
      setStyle,
      setLength,
      setEmotion,
      generateText,
      setPrompt,
      clearGeneratedText,
    ],
  );

  const handleRegenerate = useCallback(
    async (message?: {
      sessionId?: string;
      versions: MessageVersion[];
    }): Promise<void> => {
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
          images: message?.versions[message.currentVersionIndex || 0]?.images,
          userPrompt: responseData.user_prompt || '',
        };

        addVersionToMessage(targetSessionId, newVersion);
        clearGeneratedText();
      } catch (error) {
        logger.error('재생성 실패', { error });
      }
    },
    [
      isGenerating,
      style,
      length,
      sessionId,
      addVersionToMessage,
      generateId,
      clearGeneratedText,
    ],
  );

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

  return {
    // Store states
    config,
    prompt,
    originalPrompt,
    style,
    length,
    isGenerating,
    generatedText,
    generatedKeywords,
    emotion,
    wasJustGenerated,

    // Store actions
    setPrompt,
    getStyleDisplayName,
    getLengthDisplayName,
    getEmotionConfig,
    markAsProcessed,

    // Custom handlers
    handleGenerate,
    handleRegenerate,
    handleMoveToDiary,
  };
};
