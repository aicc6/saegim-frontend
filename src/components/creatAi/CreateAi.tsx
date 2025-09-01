'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Copy, RotateCcw, Save, Edit3 } from 'lucide-react';
import { useCreateStore, WritingStyle, LengthOption } from '@/stores/create';
import { useEmotionStore } from '@/stores/emotion';
import { getLogger } from '@/lib/logger';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useImageHandler } from '@/hooks/use-image-handler';
import { useErrorManagement } from '@/hooks/use-error-management';
import { useFormOptions } from '@/hooks/use-form-options';
import { useStreaming } from '@/hooks/use-streaming';
import { useClipboard } from '@/hooks/use-clipboard';
import { diaryApi } from '@/lib/api';
import { useSimpleToast } from '@/hooks/use-simple-toast';
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

// 초기 입력 화면 전용 컴포넌트

// AS-IS에서 가져온 감정 라벨 설정
const emotionLabels = {
  happy: { emoji: '😊', name: '행복', color: 'text-emotion-happy' },
  sad: { emoji: '😢', name: '슬픔', color: 'text-emotion-sad' },
  angry: { emoji: '😡', name: '화남', color: 'text-emotion-angry' },
  peaceful: { emoji: '😌', name: '평온', color: 'text-emotion-peaceful' },
  unrest: { emoji: '😰', name: '불안', color: 'text-emotion-unrest' },
};

export default function CreateAi() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);

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
  const {
    selectedImages,
    imageUrls,
    fileInputRef,
    handleImageSelect,
    handleImageRemove,
    handleAddImageClick,
    canAddMore,
  } = useImageHandler(10);

  const { styleOptions, lengthOptions } = useFormOptions({
    styles: config.styles,
    lengths: config.lengths,
  });

  const {
    isStreaming,
    streamedText,
    accumulatedText,
    displayText,
    error: streamError,
    sessionId,
    emotion: aiEmotion,
    keywords,
    isComplete,
    isTyping,
    isEditMode,
    editedText,
    regenerationCount,
    uploadedImages,
    regenerationHistory,
    startStreaming,
    resetState,
    setEditMode,
    updateEditedText,
    selectPreviousResult,
  } = useStreaming();

  const { showToastMessage } = useSimpleToast();
  const { copyToClipboard } = useClipboard(() =>
    showToastMessage('클립보드에 복사되었습니다!', 'success'),
  );

  useErrorManagement({ error: error || streamError, clearError });

  const handleGenerateText = useCallback(async () => {
    if (isStreaming) return;

    const validation = validateForm(prompt, style, length);
    if (!validation.isValid && validation.errorMessage) {
      showValidationAlert(validation.errorMessage);
      return;
    }

    try {
      // 스트리밍 시작
      setShowResults(true);
      await startStreaming({
        prompt,
        style,
        length,
        emotion: emotion || undefined,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      });
    } catch (error) {
      logger.error('스트리밍 글 생성 실패', { error });
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

  const handleNewGeneration = useCallback(() => {
    resetState();
    setShowResults(false);
    setPrompt('');
  }, [resetState, setPrompt]);

  const handleRegenerate = useCallback(async () => {
    if (isStreaming || !sessionId) return;

    try {
      await startStreaming({
        prompt,
        style,
        length,
        emotion: emotion || undefined,
        sessionId,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      });
    } catch (error) {
      logger.error('재생성 실패', { error });
    }
  }, [
    isStreaming,
    sessionId,
    startStreaming,
    prompt,
    style,
    length,
    emotion,
    selectedImages,
  ]);

  // 다이어리 저장 기능
  const handleSaveDiary = useCallback(async () => {
    if (!isComplete || isStreaming) return;

    const textToSave = isEditMode
      ? editedText
      : accumulatedText || displayText || streamedText;
    if (!textToSave.trim()) {
      showToastMessage('저장할 내용이 없습니다.', 'error');
      return;
    }

    try {
      const result = await diaryApi.createDiary({
        title: textToSave.slice(0, 50) + (textToSave.length > 50 ? '...' : ''), // 제목은 첫 50자
        content: prompt, // 원본 프롬프트
        user_emotion: normalizeEmotionToEnglish(emotion),
        ai_generated_text: textToSave,
        ai_emotion: normalizeEmotionToEnglish(aiEmotion),
        ai_emotion_confidence: aiEmotion ? 0.8 : undefined, // 기본 신뢰도
        keywords: keywords.length > 0 ? keywords : undefined,
        is_public: false,
        uploaded_images: uploadedImages || undefined, // 업로드된 이미지 정보 포함
      });

      if (result.success) {
        showToastMessage('다이어리가 성공적으로 저장되었습니다!', 'success');

        // 저장 후 해당 다이어리로 이동할지 물어보기
        if (window.confirm('저장된 다이어리를 보시겠습니까?')) {
          router.push(
            `/viewPost/${(result.data as { id: string }).id}?from=${encodeURIComponent('/create')}`,
          );
        }
      } else {
        throw new Error(result.message || '다이어리 저장에 실패했습니다.');
      }
    } catch (error) {
      logger.error('다이어리 저장 실패', { error });
      showToastMessage(
        '다이어리 저장에 실패했습니다. 다시 시도해주세요.',
        'error',
      );
    }
  }, [
    isComplete,
    isStreaming,
    isEditMode,
    editedText,
    accumulatedText,
    displayText,
    streamedText,
    prompt,
    emotion,
    aiEmotion,
    keywords,
    uploadedImages,
    showToastMessage,
    router,
  ]);

  // 결과가 있으면 CreateChat 컴포넌트를 사용하도록 안내
  // (실제로는 페이지 라우팅으로 처리될 예정)

  return (
    <div className="rounded-3xl bg-ivory-cream shadow-card relative p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {!showResults ? (
        <>
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
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#3F764A]">
              AI가 글을 생성하고 있습니다
            </h1>
            <button
              onClick={handleNewGeneration}
              className="px-4 py-2 text-sm bg-sage-60 text-white rounded-lg hover:bg-sage-70 transition-colors"
            >
              새 글 작성
            </button>
          </div>
        </>
      )}

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

      {/* 스트리밍 결과 표시 영역 */}
      {showResults && (
        <div className="mt-6 space-y-4">
          {/* 스트리밍 텍스트 표시 */}
          <div className="bg-white rounded-xl border border-sage-20 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sage-70 font-medium">생성된 글</span>
                {isStreaming && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-sage-60 rounded-full animate-pulse"></div>
                    <div
                      className="w-1 h-1 bg-sage-60 rounded-full animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-sage-60 rounded-full animate-pulse"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                )}
              </div>

              {isComplete && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(accumulatedText)}
                    className="p-2 text-sage-60 hover:text-sage-80 hover:bg-sage-10 rounded-lg transition-colors"
                    title="복사하기"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {regenerationCount > 0 && (
                    <span className="text-xs text-sage-60 bg-sage-10 px-2 py-1 rounded-full">
                      {regenerationCount}/5회 재생성
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ChatGPT 스타일 텍스트 메시지 버블 */}
            <div className="min-h-[120px]">
              <div className="flex items-start space-x-3">
                {/* AI 아바타 */}
                <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-sage-50 to-sage-60 rounded-full flex items-center justify-center shadow-sm ring-1 ring-white/80">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>

                {/* 메시지 버블 컨테이너 */}
                <div className="flex-1 max-w-none">
                  {isTyping ||
                  displayText ||
                  streamedText ||
                  accumulatedText ? (
                    isEditMode && isComplete ? (
                      // 편집 모드 - 개선된 스타일
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl rounded-tl-sm p-5 border border-blue-200/50 shadow-sm relative">
                        <div className="absolute -left-2 top-4 w-3 h-3 bg-gradient-to-br from-blue-50 to-indigo-50 transform rotate-45 border-l border-t border-blue-200/50"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            편집 모드
                          </span>
                        </div>
                        <textarea
                          value={editedText}
                          onChange={(e) => updateEditedText(e.target.value)}
                          className="w-full h-40 p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white text-gray-800 resize-none text-base leading-relaxed transition-all duration-200"
                          placeholder="생성된 글을 편집하세요"
                        />
                      </div>
                    ) : (
                      // 일반 표시 모드 - ChatGPT 스타일 버블
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl rounded-tl-sm p-5 border border-gray-200/60 shadow-sm relative backdrop-blur-sm">
                        <div className="absolute -left-2 top-4 w-3 h-3 bg-gradient-to-br from-gray-50 to-white transform rotate-45 border-l border-t border-gray-200/60"></div>
                        <div className="relative">
                          <p className="text-gray-800 leading-relaxed text-base font-normal whitespace-pre-wrap tracking-wide">
                            {isEditMode && isComplete
                              ? editedText
                              : isTyping
                                ? displayText
                                : streamedText || accumulatedText}
                            {(isStreaming || isTyping) && (
                              <span className="inline-block w-0.5 h-5 bg-gray-600 ml-1 animate-pulse"></span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  ) : isStreaming ? (
                    // 로딩 상태 - 개선된 애니메이션
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl rounded-tl-sm p-5 border border-gray-200/60 shadow-sm relative">
                      <div className="absolute -left-2 top-4 w-3 h-3 bg-gradient-to-br from-gray-50 to-white transform rotate-45 border-l border-t border-gray-200/60"></div>
                      <div className="flex items-center py-4">
                        <div className="flex items-center gap-3 text-gray-500">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                          <span className="text-sm">
                            AI가 글을 생성하고 있습니다...
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 대기 상태
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl rounded-tl-sm p-5 border border-gray-200/60 shadow-sm relative opacity-60">
                      <div className="absolute -left-2 top-4 w-3 h-3 bg-gradient-to-br from-gray-50 to-white transform rotate-45 border-l border-t border-gray-200/60"></div>
                      <div className="flex items-center justify-center py-6 text-gray-400">
                        <span className="text-sm">
                          생성된 글이 여기에 표시됩니다
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 업로드된 이미지 표시 */}
            {isComplete && uploadedImages && uploadedImages.length > 0 && (
              <div className="mt-6">
                <div className="bg-white rounded-xl border border-sage-20 p-4 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"
                      />
                    </svg>
                    첨부된 이미지
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        {image.original_url ? (
                          <Image
                            src={image.original_url}
                            alt={`업로드된 이미지 ${index + 1}`}
                            width={120}
                            height={120}
                            className="w-24 h-24 sm:w-30 sm:h-30 object-cover rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-30 sm:h-30 bg-gray-200 rounded-xl border border-gray-200 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 모던 카드 스타일 결과 상세 표시 (완료 후) */}
            {isComplete && (
              <div className="mt-6 space-y-5">
                {/* AI 분석 결과 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI 분석 감정 카드 */}
                  {aiEmotion && (
                    <div className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
                      {/* 장식적 배경 요소 */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full -translate-y-10 translate-x-10"></div>

                      <div className="relative z-10">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                            <span className="text-white text-sm">💭</span>
                          </div>
                          <h4 className="ml-3 text-base font-semibold text-gray-800">
                            AI 감정 분석
                          </h4>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-gray-100 to-gray-200/50 rounded-2xl shadow-inner">
                            <span className="text-3xl block">
                              {emotionLabels[
                                aiEmotion as keyof typeof emotionLabels
                              ]?.emoji || '😐'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-lg font-semibold mb-1 ${
                                emotionLabels[
                                  aiEmotion as keyof typeof emotionLabels
                                ]?.color || 'text-gray-600'
                              }`}
                            >
                              {emotionLabels[
                                aiEmotion as keyof typeof emotionLabels
                              ]?.name || aiEmotion}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                              AI 분석 완료
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 키워드 분석 카드 */}
                  {keywords.length > 0 && (
                    <div className="group bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
                      {/* 장식적 배경 요소 */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full -translate-y-10 translate-x-10"></div>

                      <div className="relative z-10">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm">
                            <span className="text-white text-sm">🏷️</span>
                          </div>
                          <div className="ml-3 flex items-center justify-between w-full">
                            <h4 className="text-base font-semibold text-gray-800">
                              추출된 키워드
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {keywords.length}개
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="group/tag inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200/80 hover:from-emerald-50 hover:to-teal-50 text-gray-700 hover:text-emerald-700 rounded-xl text-sm font-medium border border-gray-200/60 hover:border-emerald-200 transition-all duration-200 cursor-default shadow-sm hover:shadow-md"
                            >
                              <span className="text-emerald-500 mr-1.5 text-xs">
                                #
                              </span>
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 모던 스타일 액션 버튼들 */}
                <div className="space-y-4 pt-6">
                  {/* 메인 액션 버튼들 */}
                  <div className="flex justify-center items-center gap-3">
                    <button
                      onClick={() => {
                        if (isEditMode) {
                          setEditMode(false);
                          showToastMessage('편집이 완료되었습니다.', 'success');
                        } else {
                          setEditMode(
                            true,
                            accumulatedText || displayText || streamedText,
                          );
                        }
                      }}
                      className="group relative px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-sm border border-slate-200/60"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <Edit3 className="w-4 h-4" />
                        <span>{isEditMode ? '편집 완료' : '텍스트 편집'}</span>
                      </span>
                    </button>

                    <button
                      onClick={handleSaveDiary}
                      disabled={isStreaming || !isComplete}
                      className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30"
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>다이어리 저장</span>
                      </span>
                    </button>

                    <button
                      onClick={handleRegenerate}
                      disabled={isStreaming || regenerationCount >= 5}
                      className="group relative px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200/60"
                      title={
                        regenerationCount >= 5
                          ? '재생성 한도에 도달했습니다'
                          : `${5 - regenerationCount}회 더 재생성 가능`
                      }
                    >
                      <span className="relative z-10 flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4" />
                        <span>다시 생성 ({5 - regenerationCount}회 남음)</span>
                      </span>
                    </button>
                  </div>

                  {/* 이전 결과물 확인 드롭다운 */}
                  {regenerationHistory.length > 1 && (
                    <div className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        이전 결과물 ({regenerationHistory.length}개)
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {regenerationHistory.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => selectPreviousResult(index)}
                            className="text-xs px-3 py-2 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            결과 #{index + 1}
                            <span className="ml-1 text-gray-400">
                              (
                              {new Date(item.timestamp).toLocaleTimeString(
                                'ko-KR',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                              )
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 입력 폼 (결과가 표시되지 않을 때만) */}
      {!showResults && (
        <>
          {/* 선택된 이미지들 미리보기 */}
          {selectedImages.length > 0 && (
            <div className="mt-4 sm:mt-6 px-2">
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {selectedImages.map((image, index) => (
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
        </>
      )}
    </div>
  );
}
