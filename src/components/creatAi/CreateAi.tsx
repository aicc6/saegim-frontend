'use client';

import { useCallback, useEffect, useState, memo, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Copy, RotateCcw, Save, Edit3 } from 'lucide-react';
import { useCreateStore, WritingStyle, LengthOption } from '@/stores/create';
import { EmotionOption, useEmotionStore } from '@/stores/emotion';
import { getLogger } from '@/lib/logger';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useImageHandler } from '@/hooks/use-image-handler';
import { useErrorManagement } from '@/hooks/use-error-management';
import { useFormOptions } from '@/hooks/use-form-options';
import { useStreaming } from '@/hooks/use-streaming';
import { useClipboard } from '@/hooks/use-clipboard';
import { diaryApi } from '@/lib/api/diary';
import { useSimpleToast } from '@/hooks/use-simple-toast';
import { enhancedToast } from '@/lib/enhanced-toast';
import { useTempOptions } from '@/hooks/use-temp-options';
import { useChatUi } from '@/hooks/use-chat-ui';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatOptions } from '@/components/chat/ChatOptions';
import { ImagePreview } from '@/components/chat/ImagePreview';
import Select from '../ui/custom/Select';

const logger = getLogger('CreateAi');

// 감정 값을 영어로 정규화하는 함수
const normalizeEmotionToEnglish = (
  emotion: string | null,
): string | undefined => {
  if (!emotion) return undefined;

  const emotionMap: Record<string, string> = {
    행복: 'happy',
    기쁨: 'happy',
    슬픔: 'sad',
    우울: 'sad',
    화남: 'angry',
    분노: 'angry',
    평온: 'peaceful',
    고요: 'peaceful',
    불안: 'unrest',
    걱정: 'unrest',
    // 이미 영어인 경우 그대로 반환
    happy: 'happy',
    sad: 'sad',
    angry: 'angry',
    peaceful: 'peaceful',
    unrest: 'unrest',
  };

  return emotionMap[emotion] || emotionMap[emotion.toLowerCase()] || undefined;
};

// 생성된 글 버전 타입 정의
interface TextVersion {
  id: string;
  text: string;
  aiEmotion?: string | null;
  keywords: string[];
  createdAt: Date;
  versionNumber: number;
}

// 생성된 글 카드 타입 정의
interface GeneratedTextCard {
  id: string;
  sessionId: string; // 실제 백엔드 sessionId (UUID)
  prompt: string;
  style: string;
  length: string;
  emotion: string | null;
  versions: TextVersion[];
  currentVersionIndex: number;
  isEditMode: boolean;
  editedText: string;
  createdAt: Date;
  // AI 생성 시 사용된 이미지 정보 (서버 업로드 후 결과)
  uploadedImages?: Array<{
    file_id: string;
    original_url: string;
    thumbnail_url: string;
    mime_type: string;
    file_size: number;
    filename: string;
  }>;
}

// 메모이제이션된 서브 컴포넌트들
const MemoizedChatInput = memo(ChatInput);
const MemoizedChatOptions = memo(ChatOptions);
const MemoizedImagePreview = memo(ImagePreview);

// 메인 컴포넌트
function CreateAi() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedTextCard[]>([]);
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(
    null,
  );

  const {
    config,
    prompt,
    style,
    length,
    error,
    setPrompt,
    setStyle,
    setLength,
    clearError,
  } = useCreateStore();

  const {
    selectedEmotion: emotion,
    emotions: emotionConfigs,
    setSelectedEmotion: setEmotion,
  } = useEmotionStore();

  const { validateForm, showValidationAlert } = useFormValidation();

  // 현재 생성 중인 프롬프트를 저장하는 ref
  const currentGeneratingPromptRef = useRef<string>('');

  const {
    selectedImages,
    imageUrls,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    handleAddImageClick,
    canAddMore,
  } = useImageHandler(10);

  // 새 글 생성 폼을 위한 별도의 이미지 핸들러
  const {
    selectedImages: newSelectedImages,
    fileInputRef: newFileInputRef,
    handleImageSelect: handleNewImageSelect,
    handleImageRemove: handleNewImageRemove,
    handleAddImageClick: handleNewAddImageClick,
    clearImages: clearNewImages,
  } = useImageHandler(3);

  const { styleOptions, lengthOptions } = useFormOptions({
    styles: config.styles,
    lengths: config.lengths,
  });

  // 값을 레이블로 변환하는 헬퍼 함수들
  const getStyleLabel = useCallback(
    (value: string) => {
      const option = styleOptions.find((opt) => opt.value === value);
      return option ? option.label : value;
    },
    [styleOptions],
  );

  const getLengthLabel = useCallback(
    (value: string) => {
      const option = lengthOptions.find((opt) => opt.value === value);
      return option ? option.label : value;
    },
    [lengthOptions],
  );

  const getEmotionLabel = useCallback(
    (value: string) => {
      const emotion = emotionConfigs.find((e) => e.value === value);
      return emotion ? emotion.label : value;
    },
    [emotionConfigs],
  );

  const {
    isStreaming,
    accumulatedText,
    streamedText,
    error: streamError,
    sessionId,
    emotion: aiEmotion,
    keywords,
    isComplete,
    isPending, // 새로 추가된 pending 상태
    uploadedImages, // 업로드된 이미지 정보
    startStreaming,
    startRegeneration, // 재생성 스트리밍 함수 추가
    resetState,
  } = useStreaming();

  // 성능 최적화: 스트리밍 상태 메모이제이션
  const streamingStatus = useMemo(
    () => ({
      isStreaming,
      isPending,
      isComplete,
      hasContent: !!(streamedText || accumulatedText),
    }),
    [isStreaming, isPending, isComplete, streamedText, accumulatedText],
  );

  const { showToastMessage } = useSimpleToast();
  const { copyToClipboard } = useClipboard((text: string) =>
    enhancedToast.clipboardCopied({ text }),
  );

  useErrorManagement({ error: error || streamError, clearError });

  // ✅ 스트리밍 완료 시 카드 업데이트 로직
  useEffect(() => {
    if (isComplete && sessionId && accumulatedText) {
      setGeneratedCards((prev) => {
        const cardToUpdate = prev.find(
          (card) => card.sessionId === '' && card.versions[0].text === '',
        );
        if (cardToUpdate) {
          return prev.map((card) => {
            if (card.id === cardToUpdate.id) {
              return {
                ...card,
                sessionId,
                versions: [
                  {
                    ...card.versions[0],
                    text: accumulatedText,
                    aiEmotion: aiEmotion || '',
                    keywords: keywords || [],
                  },
                ],
                // 스트리밍에서 업로드된 이미지 정보 저장
                uploadedImages: uploadedImages || undefined,
              };
            }
            return card;
          });
        }
        return prev;
      });
    }
  }, [
    isComplete,
    sessionId,
    accumulatedText,
    aiEmotion,
    keywords,
    uploadedImages,
  ]);

  // 컴포넌트 언마운트 시 재생성 상태 정리
  useEffect(() => {
    return () => {
      setRegeneratingCardId(null);
    };
  }, []);

  // ChatUI 관련 훅들 추가
  const { textareaRef, messagesEndRef, scrollToBottom, adjustTextareaHeight } =
    useChatUi(newPrompt);

  // Temp 옵션 관리
  const onApplyOptions = useCallback(
    (tempStyle: string, tempLength: string, tempEmotion: string) => {
      setStyle(tempStyle as WritingStyle);
      setLength(tempLength as LengthOption);
      setEmotion(tempEmotion as EmotionOption);
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

  // 스트리밍 완료 시 카드 추가/업데이트 (분리된 로직)
  useEffect(() => {
    if (!isComplete || !accumulatedText || isStreaming || !sessionId) {
      return;
    }

    // ✅ Best Practice: 단순한 상태 업데이트로 롤백
    setGeneratedCards((prev) => {
      // 재생성 중인 카드가 있으면 해당 카드만 업데이트
      if (regeneratingCardId) {
        const existingCardIndex = prev.findIndex(
          (card) => card.id === regeneratingCardId,
        );

        if (existingCardIndex !== -1) {
          return prev.map((card, index) => {
            if (index === existingCardIndex) {
              const newVersion: TextVersion = {
                id: `${sessionId}_v${card.versions.length + 1}`,
                text: accumulatedText,
                aiEmotion: aiEmotion || null,
                keywords: keywords || [],
                createdAt: new Date(),
                versionNumber: card.versions.length + 1,
              };
              return {
                ...card,
                versions: [newVersion, ...card.versions],
                currentVersionIndex: 0,
                editedText: accumulatedText,
              };
            }
            return card;
          });
        }
        return prev; // 재생성 중인 카드를 찾지 못한 경우
      }

      // 신규 생성: currentGeneratingPromptRef가 있을 때만 새 카드 생성
      if (currentGeneratingPromptRef.current) {
        const cardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const currentStyle = tempStyle || style;
        const currentLength = tempLength || length;
        const currentEmotion = tempEmotion || emotion;

        const initialVersion: TextVersion = {
          id: `${cardId}_v1`,
          text: accumulatedText,
          aiEmotion: aiEmotion || null,
          keywords: keywords || [],
          createdAt: new Date(),
          versionNumber: 1,
        };

        const newCard: GeneratedTextCard = {
          id: cardId,
          sessionId: sessionId,
          prompt: currentGeneratingPromptRef.current,
          style: currentStyle,
          length: currentLength,
          emotion: currentEmotion,
          versions: [initialVersion],
          currentVersionIndex: 0,
          isEditMode: false,
          editedText: accumulatedText,
          createdAt: new Date(),
          // 새 글 생성 시 사용된 이미지 저장
          uploadedImages: uploadedImages || undefined,
        };

        // 신규 생성 완료 후 폼 리셋
        setTimeout(() => {
          setNewPrompt('');
          clearNewImages();
          resetState(false); // 스트리밍 상태도 완전 초기화
          currentGeneratingPromptRef.current = ''; // ref도 초기화
        }, 100);

        return [...prev, newCard];
      }

      // 신규 생성도 재생성도 아닌 경우 (예: 직접 sessionId가 전달된 경우)
      return prev;
    });

    setShowResults(true);
    // 스트리밍 완료 시 regeneratingCardId 초기화
    setRegeneratingCardId(null);
  }, [
    isComplete,
    accumulatedText,
    isStreaming,
    sessionId,
    aiEmotion,
    keywords,
    newPrompt,
    regeneratingCardId,
    prompt,
    tempStyle,
    style,
    tempLength,
    length,
    tempEmotion,
    emotion,
    clearNewImages,
    resetState,
    uploadedImages,
  ]);

  const handleGenerateText = useCallback(async () => {
    if (isStreaming) return;

    try {
      const validation = validateForm(prompt, style, length);
      if (!validation.isValid && validation.errorMessage) {
        showValidationAlert(validation.errorMessage);
        return;
      }

      // ✅ 핵심 수정: 스트리밍 시작과 동시에 빈 카드 즉시 생성
      const newCardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newCard: GeneratedTextCard = {
        id: newCardId,
        prompt,
        style,
        length,
        emotion: emotion || null,
        sessionId: '', // startStreaming에서 업데이트됨
        versions: [
          {
            id: `version-${Date.now()}`,
            text: '', // 빈 텍스트로 시작
            aiEmotion: '',
            keywords: [],
            createdAt: new Date(),
            versionNumber: 1,
          },
        ],
        currentVersionIndex: 0,
        isEditMode: false,
        editedText: '',
        createdAt: new Date(),
        // AI 생성에 사용된 이미지 저장 - 스트리밍 시 업로드됨
        uploadedImages: undefined, // 스트리밍 완료 후 업데이트됨
      };

      setShowResults(true);
      setGeneratedCards((prev) => [newCard, ...prev]); // 즉시 카드 추가

      await startStreaming({
        prompt,
        style,
        length,
        emotion: emotion || undefined,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      });
    } catch (error) {
      logger.error('스트리밍 글 생성 실패', { error });
      // 오류 시 결과 화면 숨기기 및 실패한 카드 제거
      setShowResults(false);
      setGeneratedCards((prev) => prev.slice(1)); // 첫 번째 카드 제거
    }
  }, [
    prompt,
    style,
    length,
    emotion,
    isStreaming,
    validateForm,
    showValidationAlert,
    startStreaming,
    selectedImages,
  ]);

  // 카드별 액션 핸들러들
  const handleCardEdit = useCallback(
    (cardId: string) => {
      // ✅ 사용자 상호작용: 즉시 반응해야 하므로 transition 사용 안함
      setGeneratedCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId) {
            const currentVersion = card.versions[card.currentVersionIndex];
            return {
              ...card,
              isEditMode: !card.isEditMode,
              editedText: card.isEditMode
                ? card.editedText
                : currentVersion.text,
            };
          }
          return card;
        }),
      );

      if (generatedCards.find((card) => card.id === cardId)?.isEditMode) {
        showToastMessage('편집이 완료되었습니다.', 'success');
      }
    },
    [generatedCards, showToastMessage],
  );

  const handleCardEditTextChange = useCallback(
    (cardId: string, newText: string) => {
      setGeneratedCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, editedText: newText } : card,
        ),
      );
    },
    [],
  );

  const handleCardSave = useCallback(
    async (cardId: string) => {
      const card = generatedCards.find((c) => c.id === cardId);
      if (!card) return;

      const currentVersion = card.versions[card.currentVersionIndex];
      const textToSave = card.isEditMode
        ? card.editedText
        : currentVersion.text;
      if (!textToSave.trim()) {
        showToastMessage('저장할 내용이 없습니다.', 'error');
        return;
      }

      try {
        // 저장 중 로딩 토스트 표시
        const loadingToast = enhancedToast.diarySaving();

        const result = await diaryApi.createDiary({
          title:
            textToSave.slice(0, 50) + (textToSave.length > 50 ? '...' : ''),
          content: card.prompt,
          user_emotion: normalizeEmotionToEnglish(card.emotion),
          ai_generated_text: textToSave,
          ai_emotion: normalizeEmotionToEnglish(
            currentVersion.aiEmotion || null,
          ),
          ai_emotion_confidence: currentVersion.aiEmotion ? 0.8 : undefined,
          keywords:
            currentVersion.keywords.length > 0
              ? currentVersion.keywords
              : undefined,
          is_public: false,
          // AI 생성 시 사용된 이미지 포함 (이미 서버에 업로드됨)
          uploaded_images:
            card.uploadedImages && card.uploadedImages.length > 0
              ? card.uploadedImages
              : undefined,
        });

        if (result.success) {
          const diaryId = (result.data as { id: string }).id;

          // 로딩 토스트를 성공 토스트로 업데이트 (액션 버튼 포함)
          enhancedToast.update(
            loadingToast,
            '다이어리가 저장되었습니다! 🎉',
            'success',
            {
              description: '생성된 글이 성공적으로 저장되었습니다.',
              action: {
                label: '다이어리 보기',
                onClick: () =>
                  router.push(
                    `/viewPost/${diaryId}?from=${encodeURIComponent('/create')}`,
                  ),
              },
              duration: 5000,
            },
          );
        } else {
          // 로딩 토스트를 에러 토스트로 업데이트
          enhancedToast.update(
            loadingToast,
            '다이어리 저장에 실패했습니다',
            'error',
            {
              description: result.message || '다시 시도해주세요.',
              duration: 4000,
            },
          );
        }
      } catch (error) {
        logger.error('다이어리 저장 실패', { error });
        enhancedToast.error('다이어리 저장에 실패했습니다', {
          description: '다시 시도해주세요.',
        });
      }
    },
    [generatedCards, showToastMessage, router],
  );

  const handleCardRegenerate = useCallback(
    async (cardId: string) => {
      const card = generatedCards.find((c) => c.id === cardId);
      if (!card || isStreaming || card.versions.length >= 5) return;

      setRegeneratingCardId(cardId);

      try {
        // 스트리밍 재생성 시작 (sessionId 기반)
        await startRegeneration(card.sessionId);
      } catch (error) {
        setRegeneratingCardId(null);
        logger.error('재생성 실패', { error });
      }
    },
    [generatedCards, isStreaming, startRegeneration],
  );

  const handleCardCopy = useCallback(
    (text: string) => {
      copyToClipboard(text);
    },
    [copyToClipboard],
  );

  // 버전 변경 핸들러
  const handleVersionChange = useCallback(
    (cardId: string, versionIndex: number) => {
      setGeneratedCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? {
                ...card,
                currentVersionIndex: versionIndex,
                editedText: card.versions[versionIndex].text,
                isEditMode: false,
              }
            : card,
        ),
      );
    },
    [],
  );

  // 새 폼에서 글 생성
  const handleNewFormGenerate = useCallback(async () => {
    if (isStreaming || !newPrompt.trim()) return;

    const validation = validateForm(newPrompt, tempStyle, tempLength);
    if (!validation.isValid && validation.errorMessage) {
      showValidationAlert(validation.errorMessage);
      return;
    }

    try {
      // 현재 생성 중인 프롬프트 저장
      currentGeneratingPromptRef.current = newPrompt;

      // 새 글 생성 시작 (별도 초기화 불필요)
      await startStreaming({
        prompt: newPrompt,
        style: tempStyle,
        length: tempLength,
        emotion: tempEmotion || undefined,
        images: newSelectedImages.length > 0 ? newSelectedImages : undefined,
      });
      setTimeout(scrollToBottom, 200);
    } catch (error) {
      logger.error('새 글 생성 실패', { error });
    }
  }, [
    isStreaming,
    newPrompt,
    tempStyle,
    tempLength,
    tempEmotion,
    newSelectedImages,
    validateForm,
    showValidationAlert,
    startStreaming,
    scrollToBottom,
  ]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !isStreaming &&
        newPrompt.trim()
      ) {
        e.preventDefault();
        handleNewFormGenerate();
      }
    },
    [isStreaming, newPrompt, handleNewFormGenerate],
  );

  // showResults가 true이거나 스트리밍 중일 때는 CreateChat 스타일 레이아웃 사용
  if (showResults || isStreaming) {
    return (
      <div className="flex bg-sage-20 min-h-screen flex-col relative">
        {/* 상단 스크롤 영역 - 단순한 스타일 */}
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="mx-auto max-w-2xl space-y-4">
            {/* 생성된 카드들 */}
            {generatedCards.map((card) => {
              const currentVersion = card.versions[card.currentVersionIndex];
              const isRegenerating =
                card.id === regeneratingCardId && isStreaming;
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        생성된 글
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* 버전 선택 버튼들 */}
                      {card.versions.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">버전:</span>
                          <div className="flex gap-1">
                            {[...card.versions]
                              .sort((a, b) => a.versionNumber - b.versionNumber)
                              .map((version) => {
                                const originalIndex = card.versions.findIndex(
                                  (v) => v.id === version.id,
                                );
                                return (
                                  <button
                                    key={version.id}
                                    onClick={() =>
                                      handleVersionChange(
                                        card.id,
                                        originalIndex,
                                      )
                                    }
                                    className={`w-6 h-6 text-xs rounded-full transition-colors ${
                                      originalIndex === card.currentVersionIndex
                                        ? 'bg-sage-90 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                  >
                                    {version.versionNumber}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* 액션 버튼들 - 아이콘만 표시 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCardEdit(card.id)}
                          disabled={isRegenerating}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={card.isEditMode ? '편집 완료' : '텍스트 편집'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCardSave(card.id)}
                          disabled={isRegenerating}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="다이어리 저장"
                        >
                          <Save className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCardRegenerate(card.id)}
                          disabled={isStreaming || card.versions.length >= 5}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            isRegenerating
                              ? '새 버전 생성 중...'
                              : card.versions.length >= 5
                                ? '재생성 한도에 도달했습니다'
                                : `${5 - card.versions.length}회 더 재생성 가능`
                          }
                        >
                          <RotateCcw
                            className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`}
                          />
                        </button>

                        <button
                          onClick={() =>
                            handleCardCopy(
                              card.isEditMode
                                ? card.editedText
                                : currentVersion.text,
                            )
                          }
                          disabled={isRegenerating}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="복사하기"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 텍스트 표시 영역 */}
                  <div className="prose prose-gray max-w-none">
                    {card.isEditMode ? (
                      // 편집 모드
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            편집 모드
                          </span>
                        </div>
                        <textarea
                          value={card.editedText}
                          onChange={(e) =>
                            handleCardEditTextChange(card.id, e.target.value)
                          }
                          className="w-full h-40 p-3 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-800 resize-none"
                          placeholder="생성된 글을 편집하세요"
                        />
                      </div>
                    ) : (
                      // ✅ Best Practice: 스트리밍 콘텐츠 즉시 표시 + 완료 후 연속성 보장
                      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {/* ✅ 스트리밍 중이거나 완료 직후 streamedText/accumulatedText 우선 표시 */}
                        {isStreaming &&
                        (card.sessionId === '' ||
                          card.sessionId === sessionId) ? (
                          <div className="min-h-[1.5em]">
                            {streamedText ? (
                              <>
                                {streamedText}
                                <span className="inline-block w-px h-5 bg-gray-400 ml-1 animate-pulse"></span>
                              </>
                            ) : accumulatedText ? (
                              <>
                                {accumulatedText}
                                <span className="inline-block w-px h-5 bg-gray-400 ml-1 animate-pulse"></span>
                              </>
                            ) : (
                              <span className="text-gray-500 italic">
                                AI 응답을 기다리는 중...
                              </span>
                            )}
                          </div>
                        ) : regeneratingCardId === card.id && isStreaming ? (
                          // 재생성 중 스트리밍 상태 표시
                          <div className="relative">
                            {streamedText ? (
                              <>
                                {streamedText}
                                <span className="inline-block w-px h-5 bg-indigo-400 ml-1 animate-pulse"></span>
                              </>
                            ) : accumulatedText ? (
                              <>
                                {accumulatedText}
                                <span className="inline-block w-px h-5 bg-indigo-400 ml-1 animate-pulse"></span>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.1s' }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.2s' }}
                                  ></div>
                                </div>
                                <span className="text-indigo-600 text-sm">
                                  새 버전 생성 중...
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // ✅ 핵심 수정: 스트리밍 완료 후 연속성 보장
                          // currentVersion.text가 없으면 streamedText나 accumulatedText 우선 사용
                          currentVersion.text ||
                          streamedText ||
                          accumulatedText || (
                            <span className="text-gray-400 italic">
                              텍스트가 없습니다
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* 카드 메타 정보 */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="max-w-48 truncate" title={card.prompt}>
                        프롬프트: {card.prompt}
                      </span>
                      <span>문체: {getStyleLabel(card.style)}</span>
                      <span>길이: {getLengthLabel(card.length)}</span>
                      {currentVersion.aiEmotion && (
                        <span>
                          감정: {getEmotionLabel(currentVersion.aiEmotion)}
                        </span>
                      )}
                      {card.versions.length > 1 && (
                        <span>
                          버전 {currentVersion.versionNumber}/
                          {card.versions.length}
                        </span>
                      )}
                    </div>
                    <span>
                      {new Date(currentVersion.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 카드가 없을 때 안내 메시지 */}
            {!isStreaming && generatedCards.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-lg font-medium mb-2">
                  아직 생성된 글이 없습니다
                </p>
                <p className="text-sm">하단 입력창에서 글을 생성해보세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 고정 입력 영역 - CreateChat 스타일 */}
        <div className="fixed bottom-19 lg:bottom-0 z-20  w-full max-w-2xl px-4">
          <div className="mx-auto max-w-2xl">
            <div className="border-t border-gray-200 rounded-t-4xl bg-white/95 backdrop-blur-sm shadow-lg p-4 space-y-3">
              {/* 선택된 이미지들 미리보기 */}
              <MemoizedImagePreview
                selectedImages={newSelectedImages}
                onRemove={handleNewImageRemove}
              />

              {/* ✅ 로딩 블록 제거: 실제 카드에서 실시간 스트리밍 표시 */}

              {/* 메인 입력창 */}
              <MemoizedChatInput
                textareaRef={textareaRef}
                prompt={newPrompt}
                isGenerating={streamingStatus.isStreaming}
                selectedImages={newSelectedImages}
                onPromptChange={setNewPrompt}
                onKeyDown={handleKeyDown}
                onGenerate={handleNewFormGenerate}
                onAddImageClick={handleNewAddImageClick}
                adjustTextareaHeight={adjustTextareaHeight}
              />

              <input
                ref={newFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImageSelect}
                className="hidden"
              />

              {/* 옵션 선택 */}
              <MemoizedChatOptions
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

        <div ref={messagesEndRef} />
      </div>
    );
  }

  // 초기 입력 화면
  return (
    <div className="rounded-3xl bg-ivory-cream shadow-card relative p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-poetic font-bold text-[#3F764A] text-center">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-soft-rose text-xl sm:text-2xl md:text-3xl">
            ✿
          </span>
          어떤 글을 만들어드릴까요?
        </span>
      </h1>

      <p className="mt-2 text-sm sm:text-base text-body text-text-primary text-center px-2">
        키워드나 짧은 글을 입력하면 AI가 감정적인 글을 생성해 드립니다
      </p>

      {/* 에러 메시지 표시 */}
      {(error || streamError) && (
        <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl mx-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700 text-xs sm:text-sm font-medium">
              {error || streamError}
            </p>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
              aria-label="에러 메시지 닫기"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 입력 폼 */}
      {/* 선택된 이미지들 미리보기 */}
      {selectedImages.length > 0 && (
        <div className="mt-4 sm:mt-6 px-2">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {selectedImages.map((_, index) => (
              <div key={index} className="relative group">
                <Image
                  src={imageUrls[index]}
                  alt={`선택된 이미지 ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-sage-30"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary text-center">
            {selectedImages.length}/10개 이미지 선택됨
          </p>
        </div>
      )}

      {/* textarea와 이미지 추가 버튼 */}
      <div className="relative mt-4 sm:mt-6 px-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="예: 바람, 초록빛 오후, 천천히 걷는 길"
          className="w-full rounded-xl border border-border-subtle bg-white p-3 sm:p-4 pr-12 text-sm sm:text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-border-focus shadow-card resize-none"
        />

        {/* 이미지 추가 버튼 - textarea 내부 오른쪽 위 */}
        {canAddMore && (
          <button
            type="button"
            onClick={handleAddImageClick}
            className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sage-60 hover:text-sage-80 hover:bg-sage-10 rounded-lg transition-colors"
            title="이미지 추가"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}

        {/* 숨겨진 파일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 px-2">
        {/* 문체와 길이 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <div
              id="style-label"
              className="mb-2 block text-xs sm:text-sm text-text-secondary"
            >
              문체 선택
            </div>
            <Select
              value={style}
              onChange={(v) => setStyle(v as WritingStyle)}
              options={styleOptions}
              ariaLabel="문체 선택"
            />
          </div>
          <div>
            <div
              id="length-label"
              className="mb-2 block text-xs sm:text-sm text-text-secondary"
            >
              길이 선택
            </div>
            <Select
              value={length}
              onChange={(v) => setLength(v as LengthOption)}
              options={lengthOptions}
              ariaLabel="길이 선택"
            />
          </div>
        </div>

        {/* 감정 선택 */}
        <div>
          <div className="mb-3 block text-xs sm:text-sm text-text-secondary text-center">
            감정을 선택해주세요 😊 (선택 사항)
          </div>
          <div
            className="flex flex-wrap gap-2 sm:gap-3 justify-center"
            role="group"
            aria-label="감정 선택"
          >
            {emotionConfigs.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEmotion(emotion === value ? '' : value)}
                className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 text-lg sm:text-2xl transition-all ${
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
          <p className="mt-2 text-center text-xs sm:text-sm text-text-secondary">
            선택된 감정:{' '}
            <span className="font-medium text-sage-100">
              {emotion
                ? emotionConfigs.find((e) => e.value === emotion)?.label ||
                  emotion
                : '감정 선택 안함'}
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerateText}
        disabled={isStreaming || !prompt.trim()}
        className="mt-6 sm:mt-8 w-full rounded-xl bg-sage-90 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-text-on-color hover:bg-sage-100 active:bg-sage-80 disabled:opacity-40 transition-colors shadow-card mx-2"
      >
        {isStreaming ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-sage-30 border-t-sage-70" />
            생성 중...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
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

// React.memo로 감싸서 불필요한 리렌더링 방지
export default memo(CreateAi);
