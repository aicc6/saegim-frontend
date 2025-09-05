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
import { ChatOptions } from '@/components/chat/ChatOptions';
import { ImagePreview } from '@/components/chat/ImagePreview';
import { ChatInput } from '../chat/ChatInput';
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
  // 카드가 생성될 당시 사용자가 선택한 날짜 (YYYY-MM-DD)
  diaryDate?: string;
  // AI 생성 시 사용된 이미지 정보 (서버 업로드 후 결과)
  uploadedImages?: Array<{
    file_id: string;
    original_url: string;
    thumbnail_url: string;
    mime_type: string;
    file_size: number;
    filename: string;
    isSelected: boolean; // 다이어리 저장 시 포함할지 여부
    isThumbnail: boolean; // 썸네일로 설정되었는지 여부
  }>;
}

// 메모이제이션된 서브 컴포넌트들
const MemoizedChatInput = memo(ChatInput);
const MemoizedChatOptions = memo(ChatOptions);
const MemoizedImagePreview = memo(ImagePreview);

// 이미지 선택 UI 컴포넌트
const ImageSelectionUI = memo(
  ({
    images,
    cardId,
    onImageSelect,
    onImageThumbnail,
  }: {
    images: Array<{
      file_id: string;
      original_url: string;
      thumbnail_url: string;
      mime_type: string;
      file_size: number;
      filename: string;
      isSelected: boolean;
      isThumbnail: boolean;
    }>;
    cardId: string;
    onImageSelect: (
      cardId: string,
      imageIndex: number,
      isSelected: boolean,
    ) => void;
    onImageThumbnail: (cardId: string, imageIndex: number) => void;
  }) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-sage-10 rounded-lg border border-sage-20">
        <h4 className="text-sm font-medium text-sage-800 mb-3 flex items-center gap-2">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
            />
          </svg>
          업로드된 이미지 ({images.filter((img) => img.isSelected).length}/
          {images.length}개 선택됨)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={image.file_id} className="relative group">
              <div className="relative">
                <Image
                  src={image.thumbnail_url}
                  alt={image.filename}
                  width={96}
                  height={96}
                  className={`w-full h-24 object-cover rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-105 ${
                    image.isThumbnail
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                      : image.isSelected
                        ? 'border-green-500 shadow-md'
                        : 'border-gray-300 opacity-60'
                  }`}
                  onClick={() => onImageThumbnail(cardId, index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onImageThumbnail(cardId, index);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title={
                    image.isThumbnail
                      ? '썸네일로 설정됨 (클릭하여 변경)'
                      : '클릭하여 썸네일로 설정'
                  }
                />

                {/* 선택 상태 토글 버튼 */}
                <button
                  onClick={() =>
                    onImageSelect(cardId, index, !image.isSelected)
                  }
                  className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-md ${
                    image.isSelected
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={
                    image.isSelected
                      ? '다이어리에 포함 (클릭하여 제외)'
                      : '다이어리에서 제외 (클릭하여 포함)'
                  }
                >
                  {image.isSelected ? '✓' : '✕'}
                </button>

                {/* 썸네일 표시 */}
                {image.isThumbnail && (
                  <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    썸네일
                  </div>
                )}
              </div>

              {/* 파일명 표시 */}
              <div
                className="mt-1 text-xs text-center text-gray-600 truncate px-1"
                title={image.filename}
              >
                {image.filename}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-sage-600 bg-sage-20 p-3 rounded-lg">
          <p className="font-medium mb-2">💡 사용법:</p>
          <p>
            • <span className="text-blue-600 font-medium">파란색 테두리</span>:
            썸네일로 설정된 이미지 (다이어리 저장 시 썸네일로 사용)
          </p>
          <p>
            • <span className="text-green-600">초록색 체크</span>: 다이어리에
            포함될 이미지
          </p>
          <p>
            • <span className="text-red-600">빨간색 X</span>: 다이어리에서
            제외된 이미지
          </p>
          <p className="mt-2 text-sage-700">
            • 재생성 시에도 이미지 선택 상태가 유지됩니다
          </p>
        </div>
      </div>
    );
  },
);

ImageSelectionUI.displayName = 'ImageSelectionUI';

// 메인 컴포넌트
function CreateAi() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedTextCard[]>([]);
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const today = new Date();
    return today.toISOString().split('T')[0];
  }); // 선택된 날짜 상태
  const [isDarkMode, setIsDarkMode] = useState(false); // 다크모드 상태

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
                uploadedImages: uploadedImages
                  ? uploadedImages.map((img) => ({
                      ...img,
                      isSelected: true, // 기본적으로 선택됨
                      isThumbnail: false, // 기본적으로 썸네일 아님
                    }))
                  : undefined,
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

  // 다크모드 상태 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // 다크모드 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
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
                // 재생성 시 이미지 선택 상태는 그대로 보존
                uploadedImages: card.uploadedImages, // 기존 이미지 상태 유지
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
          diaryDate: selectedDate || undefined,
          versions: [initialVersion],
          currentVersionIndex: 0,
          isEditMode: false,
          editedText: accumulatedText,
          createdAt: new Date(),
          // 새 글 생성 시 사용된 이미지 저장
          uploadedImages: uploadedImages
            ? uploadedImages.map((img) => ({
                ...img,
                isSelected: true, // 기본적으로 선택됨
                isThumbnail: false, // 기본적으로 썸네일 아님
              }))
            : undefined,
        };

        // 신규 생성 완료 후 폼 리셋
        setTimeout(() => {
          setNewPrompt('');
          clearNewImages();
          resetState(false); // 스트리밍 상태도 완전 초기화
          currentGeneratingPromptRef.current = ''; // ref도 초기화
        }, 100);

        return [newCard, ...prev];
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
    selectedDate,
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
        diaryDate: selectedDate || undefined,
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
    selectedDate,
  ]);

  // 이미지 선택 상태 관리 함수들
  const handleImageSelection = useCallback(
    (cardId: string, imageIndex: number, isSelected: boolean) => {
      setGeneratedCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId && card.uploadedImages) {
            return {
              ...card,
              uploadedImages: card.uploadedImages.map((img, idx) =>
                idx === imageIndex ? { ...img, isSelected } : img,
              ),
            };
          }
          return card;
        }),
      );
    },
    [],
  );

  const handleImageThumbnail = useCallback(
    (cardId: string, imageIndex: number) => {
      setGeneratedCards((prev) =>
        prev.map((card) => {
          if (card.id === cardId && card.uploadedImages) {
            return {
              ...card,
              uploadedImages: card.uploadedImages.map((img, idx) => ({
                ...img,
                isThumbnail: idx === imageIndex, // 선택된 이미지만 썸네일로 설정
              })),
            };
          }
          return card;
        }),
      );
    },
    [],
  );

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
          diary_date: card.diaryDate || selectedDate || undefined, // 카드 고유 날짜 우선
          is_public: false,
          // AI 생성 시 사용된 이미지 포함 (이미 서버에 업로드됨)
          uploaded_images:
            card.uploadedImages && card.uploadedImages.length > 0
              ? card.uploadedImages
                  .filter((img) => img.isSelected) // 선택된 이미지만 포함
                  .map((img) => ({
                    file_id: img.file_id,
                    original_url: img.original_url,
                    thumbnail_url: img.thumbnail_url, // 모든 이미지에 썸네일 URL 포함
                    mime_type: img.mime_type,
                    file_size: img.file_size,
                    filename: img.filename,
                  }))
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
    [generatedCards, showToastMessage, router, selectedDate],
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
        diaryDate: selectedDate || undefined,
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
    selectedDate,
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
      <div className="flex bg-background-primary dark:bg-background-dark min-h-screen flex-col relative">
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
                  className="bg-background-primary dark:bg-background-dark-secondary rounded-lg border border-border-subtle dark:border-border-dark p-6 shadow-sm relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark">
                        생성된 글
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* 버전 선택 버튼들 */}
                      {card.versions.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary dark:text-text-secondary-dark">
                            버전:
                          </span>
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
                                        : 'bg-background-secondary text-text-secondary hover:bg-background-hover dark:bg-background-dark dark:text-text-secondary-dark dark:hover:bg-background-dark-secondary'
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
                          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-hover dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:bg-background-dark-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="p-2 text-sage-70 hover:text-sage-80 hover:bg-sage-10 dark:text-sage-40 dark:hover:text-sage-30 dark:hover:bg-background-dark-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-hover dark:text-text-secondary-dark dark:hover:text-text-primary-dark dark:hover:bg-background-dark-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="rounded-lg p-4 border bg-background-secondary dark:bg-background-dark border-border-subtle dark:border-border-dark">
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
                          className="w-full h-40 p-3 border border-border-subtle dark:border-border-dark rounded-lg focus:outline-none focus:border-border-focus bg-background-primary dark:bg-background-dark-secondary text-text-primary dark:text-text-primary-dark resize-none"
                          placeholder="생성된 글을 편집하세요"
                        />
                      </div>
                    ) : (
                      // ✅ Best Practice: 스트리밍 콘텐츠 즉시 표시 + 완료 후 연속성 보장
                      <div className="text-text-primary dark:text-text-primary-dark leading-relaxed whitespace-pre-wrap">
                        {/* ✅ 스트리밍 중이거나 완료 직후 streamedText/accumulatedText 우선 표시 */}
                        {isStreaming &&
                        (card.sessionId === '' ||
                          card.sessionId === sessionId) ? (
                          <div className="min-h-[1.5em]">
                            {streamedText ? (
                              <>
                                {streamedText}
                                <span className="inline-block w-px h-5 bg-border-strong dark:bg-border-dark ml-1 animate-pulse"></span>
                              </>
                            ) : accumulatedText ? (
                              <>
                                {accumulatedText}
                                <span className="inline-block w-px h-5 bg-border-strong dark:bg-border-dark ml-1 animate-pulse"></span>
                              </>
                            ) : (
                              <span className="text-text-secondary dark:text-text-secondary-dark italic">
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
                                <span className="inline-block w-px h-5 bg-sage-60 dark:bg-sage-40 ml-1 animate-pulse"></span>
                              </>
                            ) : accumulatedText ? (
                              <>
                                {accumulatedText}
                                <span className="inline-block w-px h-5 bg-sage-60 dark:bg-sage-40 ml-1 animate-pulse"></span>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-1.5 bg-sage-60 dark:bg-sage-40 rounded-full animate-bounce"></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-sage-60 dark:bg-sage-40 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.1s' }}
                                  ></div>
                                  <div
                                    className="w-1.5 h-1.5 bg-sage-60 dark:bg-sage-40 rounded-full animate-bounce"
                                    style={{ animationDelay: '0.2s' }}
                                  ></div>
                                </div>
                                <span className="text-text-secondary dark:text-text-secondary-dark text-sm">
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
                            <span className="text-text-secondary dark:text-text-secondary-dark italic">
                              텍스트가 없습니다
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* 카드 메타 정보 */}
                  <div className="mt-4 pt-3 border-t border-border-subtle dark:border-border-dark text-xs text-text-secondary dark:text-text-secondary-dark flex items-center justify-between">
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
                    <div className="flex items-center gap-4">
                      {/* 선택된 날짜 표시 (카드 고유 날짜 사용) */}
                      <span className="text-sage-600 font-medium">
                        선택된날짜:{' '}
                        {card.diaryDate
                          ? new Date(card.diaryDate).toLocaleDateString(
                              'ko-KR',
                              {
                                month: 'long',
                                day: 'numeric',
                              },
                            )
                          : '오늘 날짜로 저장'}
                      </span>
                      <span>
                        {new Date(
                          currentVersion.createdAt,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* 이미지 선택 UI */}
                  {card.uploadedImages && card.uploadedImages.length > 0 && (
                    <ImageSelectionUI
                      images={card.uploadedImages}
                      cardId={card.id}
                      onImageSelect={handleImageSelection}
                      onImageThumbnail={handleImageThumbnail}
                    />
                  )}
                </div>
              );
            })}

            {/* 카드가 없을 때 안내 메시지 */}
            {!isStreaming && generatedCards.length === 0 && (
              <div className="text-center py-12 text-text-secondary dark:text-text-secondary-dark">
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
            <div className="border-t border-border-subtle dark:border-border-dark rounded-t-4xl bg-background-primary/95 dark:bg-background-dark-secondary/95 backdrop-blur-sm shadow-lg p-4 space-y-3">
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
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
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
    <div className="rounded-3xl bg-background-primary dark:bg-background-dark-secondary shadow-card relative p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-poetic font-bold text-[#3F764A] text-center">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-soft-rose text-xl sm:text-2xl md:text-3xl">
            ✿
          </span>
          어떤 글을 만들어드릴까요?
        </span>
      </h1>

      <p className="mt-2 text-sm sm:text-base text-body text-text-secondary dark:text-text-secondary-dark text-center px-2">
        키워드나 짧은 글을 입력하면 AI가 감정적인 글을 생성해 드립니다
      </p>

      {/* 에러 메시지 표시 */}
      {(error || streamError) && (
        <div className="mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl mx-2">
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
            <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">
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

      {/* 글쓰기 폼 - 날짜 선택 포함 */}
      <div className="mt-4 sm:mt-6 px-2">
        <div className="bg-background-primary dark:bg-background-dark-secondary rounded-xl border border-border-subtle dark:border-border-dark shadow-card overflow-hidden">
          {/* 헤더 - 날짜 선택과 이미지 추가 버튼 */}
          <div className="flex items-center justify-between px-4 py-3 bg-sage-5/30 dark:bg-background-dark/30">
            {/* 날짜 선택 - 왼쪽 */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-sage-30 dark:border-sage-40 rounded-lg text-sage-90 focus:outline-none focus:ring-2 focus:ring-sage-50 dark:text-white dark:focus:ring-sage-40"
              style={{
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                color: isDarkMode ? 'white' : '#1f2937',
              }}
              max={new Date().toISOString().split('T')[0]}
            />
            {/* 이미지 추가 버튼 - 오른쪽 */}
            {canAddMore && (
              <button
                type="button"
                onClick={handleAddImageClick}
                className="w-8 h-8 flex items-center justify-center text-sage-60 dark:text-sage-40 hover:text-sage-80 dark:hover:text-sage-30 hover:bg-sage-10 dark:hover:bg-background-dark-secondary rounded-lg transition-colors"
                title="이미지 추가"
              >
                <svg
                  className="w-5 h-5"
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
          </div>

          {/* textarea 영역 */}
          <div className="p-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="예: 바람, 초록빛 오후, 천천히 걷는 길"
              className="w-full text-sm sm:text-base text-sage-200 placeholder:text-sage-100/70 dark:placeholder:text-sage-40/70 focus:outline-none resize-none bg-sage-5/20 dark:bg-sage-40/10 rounded-lg p-3 border border-sage-20/50 dark:border-sage-40/30 focus:border-sage-40 dark:focus:border-sage-30 transition-colors"
            />
          </div>
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
      </div>

      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 px-2">
        {/* 문체와 길이 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <div
              id="style-label"
              className="mb-2 block text-xs sm:text-sm text-text-secondary dark:text-text-secondary-dark"
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
              className="mb-2 block text-xs sm:text-sm text-text-secondary dark:text-text-secondary-dark"
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
          <div className="mb-3 block text-xs sm:text-sm text-text-secondary dark:text-text-secondary-dark text-center">
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
                    : 'border-border-subtle dark:border-border-dark bg-background-primary dark:bg-background-dark-secondary hover:border-sage-40 hover:bg-sage-10 dark:hover:bg-background-dark-secondary hover:scale-105'
                }`}
                aria-label={`${label} 선택`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs sm:text-sm text-text-secondary dark:text-text-secondary-dark">
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
        className="mt-6 sm:mt-8 w-full rounded-xl bg-sage-90 dark:bg-sage-80 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-white dark:text-sage-10 hover:bg-sage-100 dark:hover:bg-sage-70 active:bg-sage-80 dark:active:bg-sage-90 disabled:opacity-40 transition-colors shadow-card mx-2"
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
