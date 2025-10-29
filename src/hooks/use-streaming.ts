'use client';

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { getLogger } from '@/lib/logger';
import { imageApi } from '@/lib/api/image';
import { aiApi } from '@/lib/api/ai';
import { useLanguageStore, type Language } from '@/stores/language';

const logger = getLogger('useStreaming');

// 사용자 친화적인 오류 메시지 변환 함수
function getFriendlyErrorMessage(error: string): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.';

  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('server had an error') ||
    errorLower.includes('processing your request')
  ) {
    return 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }

  if (errorLower.includes('rate limit') || errorLower.includes('quota')) {
    return 'AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  }

  if (
    errorLower.includes('timeout') ||
    errorLower.includes('service unavailable')
  ) {
    return 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  if (errorLower.includes('token') && errorLower.includes('limit')) {
    return '입력 내용이 너무 깁니다. 더 짧은 내용으로 다시 시도해주세요.';
  }

  // 기본 오류 메시지
  return 'AI 텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

export interface StreamingState {
  isStreaming: boolean;
  streamedText: string;
  accumulatedText: string;
  displayText: string; // 타이핑 애니메이션용 표시 텍스트
  error: string | null;
  sessionId: string | null;
  emotion: string | null;
  keywords: string[];
  isComplete: boolean;
  isTyping: boolean; // 타이핑 애니메이션 진행 중
  isEditMode: boolean; // 편집 모드 상태
  editedText: string; // 편집된 텍스트
  regenerationCount: number; // 현재 재생성 횟수
  uploadedImages: Array<{
    file_id: string;
    original_url: string;
    thumbnail_url: string;
    mime_type: string;
    file_size: number;
    filename: string;
  }> | null; // 업로드된 이미지 정보
  regenerationHistory: Array<{
    text: string;
    emotion: string | null;
    keywords: string[];
    timestamp: number;
  }>; // 재생성 이력
}

export interface StreamChunk {
  type: 'start' | 'content' | 'complete' | 'error';
  content?: string;
  accumulated?: string;
  session_id?: string;
  regeneration_count?: number;
  emotion?: string;
  keywords?: string[];
  generated_text?: string;
  tokens_used?: number;
  error?: string;
  timestamp?: number; // 서버 타임스탬프
  chunk_index?: number; // 청크 순서
}

// ✅ Best Practice: 복잡한 큐 시스템 제거로 상수 불필요

export const useStreaming = () => {
  const { language } = useLanguageStore();
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: '',
    accumulatedText: '',
    displayText: '',
    error: null,
    sessionId: null,
    emotion: null,
    keywords: [],
    isComplete: false,
    isTyping: false,
    isEditMode: false,
    editedText: '',
    regenerationCount: 0,
    uploadedImages: null,
    regenerationHistory: [],
  });
  const [isPending, startTransition] = useTransition();

  // 메모리 최적화된 상태 업데이트
  const updateStateOptimized = useCallback(
    (updater: (prev: StreamingState) => StreamingState) => {
      startTransition(() => {
        setState(updater);
      });
    },
    [],
  );

  // 로컬 스토리지 키 생성
  const getStorageKey = useCallback((sessionId: string) => {
    return `regeneration_history_${sessionId}`;
  }, []);

  // 로컬 스토리지에서 regenerationHistory 로드
  const loadRegenerationHistory = useCallback(
    (sessionId: string) => {
      try {
        const storageKey = getStorageKey(sessionId);
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
          return JSON.parse(savedHistory);
        }
      } catch (error) {
        logger.error('regenerationHistory 로드 실패', { error });
      }
      return [];
    },
    [getStorageKey],
  );

  // 로컬 스토리지에 regenerationHistory 저장
  const saveRegenerationHistory = useCallback(
    (sessionId: string, history: StreamingState['regenerationHistory']) => {
      try {
        const storageKey = getStorageKey(sessionId);
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        logger.error('regenerationHistory 저장 실패', { error });
      }
    },
    [getStorageKey],
  );

  // ✅ Best Practice: 필요한 ref만 유지
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 복잡한 큐 시스템 관련 ref들 제거됨

  // sessionId가 변경될 때 저장된 regenerationHistory 로드
  useEffect(() => {
    if (state.sessionId) {
      const savedHistory = loadRegenerationHistory(state.sessionId);
      if (savedHistory.length > 0) {
        setState((prev) => ({
          ...prev,
          regenerationHistory: savedHistory,
        }));
      }
    }
  }, [state.sessionId, loadRegenerationHistory]);

  // regenerationHistory가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (state.sessionId && state.regenerationHistory.length > 0) {
      saveRegenerationHistory(state.sessionId, state.regenerationHistory);
    }
  }, [state.sessionId, state.regenerationHistory, saveRegenerationHistory]);

  // ✅ Best Practice: 단순화된 직접 텍스트 업데이트
  const appendStreamText = useCallback((content: string) => {
    if (!content) return;

    logger.debug('청크 렌더링', { content });

    // 🔥 핵심 개선: 복잡한 큐 없이 즉시 상태 업데이트
    setState((prev) => ({
      ...prev,
      streamedText: prev.streamedText + content,
    }));
  }, []);

  // 타이핑 애니메이션 제거됨 - 순수 스트리밍 경험 제공

  const startStreaming = useCallback(
    async (data: {
      prompt: string;
      style: string;
      length: string;
      emotion?: string;
      sessionId?: string;
      images?: File[];
      diaryDate?: string;
      language?: Language;
    }) => {
      try {
        // 기존 연결 정리
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // 기존 타이핑 애니메이션 정리
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (streamingTypingTimeoutRef.current) {
          clearTimeout(streamingTypingTimeoutRef.current);
        }

        // ✅ Best Practice: 단순한 초기화
        // 복잡한 큐 시스템 변수들 제거됨

        // 초기 상태 설정
        setState((prev) => ({
          ...prev,
          isStreaming: true,
          streamedText: '',
          accumulatedText: '',
          displayText: '',
          error: null,
          sessionId: data.sessionId || null, // 새 글 생성 시 sessionId 초기화
          emotion: null,
          keywords: [],
          isComplete: false,
          isTyping: false,
          isEditMode: false,
          editedText: '',
        }));

        // 이미지 업로드 처리 (있는 경우)
        let uploadedImages: Array<{
          file_id: string;
          original_url: string;
          thumbnail_url: string;
          mime_type: string;
          file_size: number;
          filename: string;
        }> | null = null;
        if (data.images && data.images.length > 0) {
          try {
            const imageUploadResponse = await imageApi.uploadDiaryImages(
              data.images,
            );

            if (imageUploadResponse.success) {
              uploadedImages = imageUploadResponse.data;

              // 업로드된 이미지를 상태에 저장
              setState((prev) => ({
                ...prev,
                uploadedImages: uploadedImages,
              }));

              logger.info('이미지 업로드 성공', { uploadedImages });
            } else {
              logger.warn('이미지 업로드 실패, 텍스트만 생성 진행');
            }
          } catch (imageError) {
            logger.warn('이미지 업로드 중 오류 발생, 텍스트만 생성 진행', {
              imageError,
            });
          }
        }

        // 스트리밍 요청 시작
        const response = await aiApi.generateTextStream({
          prompt: data.prompt,
          style: data.style,
          length: data.length,
          emotion: data.emotion || '',
          sessionId: data.sessionId,
          language: data.language || language,
          uploaded_images: uploadedImages,
          diary_date: data.diaryDate,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('응답 본문이 없습니다.');
        }

        // ReadableStream 처리 + 디버깅 로깅
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let chunkCount = 0;
        let totalData = '';
        logger.debug('🎬 ReadableStream 처리 시작');

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            logger.debug('📋 스트리밍 완료 요약', {
              totalChunks: chunkCount,
              totalDataLength: totalData.length,
              isRealStreaming: chunkCount > 1,
            });
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          totalData += chunk;

          logger.debug(`📦 청크 #${chunkCount} 수신`, {
            chunkSize: chunk.length,
            chunkPreview: chunk.substring(0, 100),
            timestamp: Date.now(),
          });

          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // 'data: ' 제거
                if (jsonData.trim()) {
                  const parsedData: StreamChunk = JSON.parse(jsonData);

                  logger.debug('🎯 스트리밍 이벤트 수신', {
                    type: parsedData.type,
                    contentLength: parsedData.content?.length || 0,
                    contentPreview:
                      parsedData.content?.substring(0, 50) || null,
                    timestamp: parsedData.timestamp || Date.now(),
                  });

                  switch (parsedData.type) {
                    case 'start':
                      setState((prev) => ({
                        ...prev,
                        sessionId: parsedData.session_id || null,
                      }));
                      logger.info('✅ 스트리밍 시작', {
                        sessionId: parsedData.session_id,
                      });
                      break;

                    case 'content': {
                      const newContent = parsedData.content || '';

                      logger.debug('📝 콘텐츠 청크 처리', {
                        contentLength: newContent.length,
                        content: newContent,
                        accumulated: parsedData.accumulated?.length || 0,
                      });

                      // 🔥 핵심 개선: 인위적 지연과 복잡한 큐 시스템 제거
                      if (newContent) {
                        // 즉시 텍스트 추가 (업계 표준 방식)
                        appendStreamText(newContent);
                      }

                      // accumulatedText 즉시 업데이트
                      setState((prev) => ({
                        ...prev,
                        accumulatedText:
                          parsedData.accumulated || prev.accumulatedText,
                      }));
                      break;
                    }

                    case 'complete': {
                      const finalText =
                        parsedData.generated_text || state.accumulatedText;

                      setState((prev) => {
                        const newRegenerationCount =
                          parsedData.regeneration_count || 0;

                        // 재생성 이력에 현재 결과 추가
                        const newHistoryEntry = {
                          text: finalText,
                          emotion: parsedData.emotion || null,
                          keywords: parsedData.keywords || [],
                          timestamp: Date.now(),
                        };

                        return {
                          ...prev,
                          isStreaming: false,
                          isComplete: true,
                          emotion: parsedData.emotion || null,
                          keywords: parsedData.keywords || [],
                          accumulatedText: finalText,
                          regenerationCount: newRegenerationCount,
                          regenerationHistory: [
                            ...(prev.regenerationHistory || []),
                            newHistoryEntry,
                          ],
                        };
                      });

                      // ✅ Best Practice: 단순한 완료 처리
                      // 스트리밍 완료 시 displayText를 streamedText와 동일하게 설정
                      setState((prev) => ({
                        ...prev,
                        displayText: finalText,
                        isTyping: false,
                      }));

                      logger.info('스트리밍 완료', {
                        emotion: parsedData.emotion,
                        tokensUsed: parsedData.tokens_used,
                      });
                      break;
                    }

                    case 'error': {
                      // 사용자 친화적인 오류 메시지로 변환
                      setState((prev) => ({
                        ...prev,
                        isStreaming: false,
                        error: getFriendlyErrorMessage(
                          (parsedData.error as string) ||
                            'UNKNOWN_STREAM_ERROR',
                        ),
                      }));
                      logger.error('스트리밍 오류', {
                        error: parsedData.error ?? 'UNKNOWN_STREAM_ERROR',
                      });
                      break;
                    }
                  }
                }
              } catch (parseError) {
                logger.error('JSON 파싱 오류', { parseError, line });
              }
            }
          }
        }
      } catch (error) {
        logger.error('스트리밍 시작 실패', { error });
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error:
            error instanceof Error
              ? error.message
              : '스트리밍 중 오류가 발생했습니다.',
        }));
      }
    },
    [appendStreamText, language, state.accumulatedText],
  );

  // 최적화된 스트리밍 중단 함수
  // 스트리밍 재생성 함수 (폴백 로직 포함)
  const startRegeneration = useCallback(
    async (sessionId: string) => {
      try {
        // 기존 연결 정리
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // 기존 타이핑 애니메이션 정리
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (streamingTypingTimeoutRef.current) {
          clearTimeout(streamingTypingTimeoutRef.current);
        }

        // 재생성 상태로 설정 (기존 메타데이터 유지)
        setState((prev) => ({
          ...prev,
          isStreaming: true,
          streamedText: '',
          accumulatedText: '',
          displayText: '',
          error: null,
          isComplete: false,
          isTyping: false,
        }));

        let response: Response;
        let isUsingFallback = false;

        try {
          // 1차 시도: 전용 재생성 스트리밍 엔드포인트
          response = await aiApi.regenerateStream(sessionId);

          if (!response.ok) {
            // 404 또는 501 에러인 경우 폴백 로직 사용
            if (response.status === 404 || response.status === 501) {
              logger.warn(
                '⚠️ 재생성 스트리밍 엔드포인트 미구현, 폴백 모드 사용',
              );
              isUsingFallback = true;

              // 2차 시도: 원본 입력으로 신규 생성 스트리밍
              const originalResponse =
                await aiApi.getOriginalUserInput(sessionId);
              if (!originalResponse.success) {
                throw new Error('원본 입력을 찾을 수 없습니다.');
              }

              const originalPrompt = originalResponse.data.original_input;

              // 기본 설정으로 새로운 스트리밍 생성 (재생성과 동일한 효과)
              const fallbackData = {
                prompt: originalPrompt,
                style: 'short_story', // 기본값
                length: 'medium', // 기본값
                sessionId: sessionId, // 동일한 세션 ID 사용
              };

              response = await aiApi.generateTextStream(fallbackData);

              if (!response.ok) {
                throw new Error(`폴백 스트리밍 실패: HTTP ${response.status}`);
              }

              logger.info('✅ 폴백 모드로 재생성 스트리밍 시작');
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          }
        } catch (error) {
          logger.error('재생성 시도 실패', error);
          throw error;
        }

        if (!response.body) {
          throw new Error('응답 본문이 없습니다.');
        }

        // ReadableStream 처리 (기존과 동일한 로직)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        logger.info(
          `🎬 ${isUsingFallback ? '폴백' : '재생성'} 스트리밍 처리 시작`,
        );

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6);
                if (jsonData.trim()) {
                  const parsedData: StreamChunk = JSON.parse(jsonData);

                  switch (parsedData.type) {
                    case 'start':
                      logger.info(
                        `${isUsingFallback ? '폴백' : '재생성'} 스트리밍 시작`,
                        {
                          sessionId: parsedData.session_id,
                          fallbackMode: isUsingFallback,
                        },
                      );
                      break;

                    case 'content': {
                      const newContent = parsedData.content || '';
                      if (newContent) {
                        appendStreamText(newContent);
                      }

                      setState((prev) => ({
                        ...prev,
                        accumulatedText:
                          parsedData.accumulated || prev.accumulatedText,
                      }));
                      break;
                    }

                    case 'complete': {
                      const finalText =
                        parsedData.generated_text || state.accumulatedText;

                      setState((prev) => {
                        const newRegenerationCount =
                          parsedData.regeneration_count ||
                          prev.regenerationCount + 1;

                        // 재생성 이력에 현재 결과 추가
                        const newHistoryEntry = {
                          text: finalText,
                          emotion: parsedData.emotion || null,
                          keywords: parsedData.keywords || [],
                          timestamp: Date.now(),
                        };

                        return {
                          ...prev,
                          isStreaming: false,
                          isComplete: true,
                          emotion: parsedData.emotion || null,
                          keywords: parsedData.keywords || [],
                          accumulatedText: finalText,
                          regenerationCount: newRegenerationCount,
                          regenerationHistory: [
                            ...(prev.regenerationHistory || []),
                            newHistoryEntry,
                          ],
                        };
                      });

                      // 스트리밍 완료 시 displayText를 streamedText와 동일하게 설정
                      setState((prev) => ({
                        ...prev,
                        displayText: finalText,
                        isTyping: false,
                      }));

                      logger.info(
                        `${isUsingFallback ? '폴백' : '재생성'} 스트리밍 완료`,
                        {
                          emotion: parsedData.emotion,
                          tokensUsed: parsedData.tokens_used,
                          fallbackMode: isUsingFallback,
                        },
                      );
                      break;
                    }

                    case 'error': {
                      setState((prev) => ({
                        ...prev,
                        isStreaming: false,
                        error:
                          parsedData.error || '재생성 중 오류가 발생했습니다.',
                      }));
                      logger.error('재생성 스트리밍 오류', {
                        error: parsedData.error,
                        fallbackMode: isUsingFallback,
                      });
                      break;
                    }
                  }
                }
              } catch (parseError) {
                logger.error('재생성 JSON 파싱 오류', { parseError, line });
              }
            }
          }
        }
      } catch (error) {
        logger.error('재생성 스트리밍 시작 실패', { error });
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error:
            error instanceof Error
              ? error.message
              : '재생성 중 오류가 발생했습니다.',
        }));
      }
    },
    [appendStreamText, state.accumulatedText],
  );

  const stopStreaming = useCallback(() => {
    // EventSource 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 타이머 정리
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (streamingTypingTimeoutRef.current) {
      clearTimeout(streamingTypingTimeoutRef.current);
      streamingTypingTimeoutRef.current = null;
    }

    // ✅ Best Practice: 단순한 정리
    // 복잡한 큐 시스템 제거로 정리할 것이 줄어듦

    // useTransition을 활용한 논블로킹 상태 업데이트
    updateStateOptimized((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, [updateStateOptimized]);

  const setEditMode = useCallback((isEditMode: boolean, text?: string) => {
    setState((prev) => ({
      ...prev,
      isEditMode,
      editedText:
        text ||
        prev.editedText ||
        prev.accumulatedText ||
        prev.displayText ||
        prev.streamedText,
    }));
  }, []);

  const updateEditedText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, editedText: text }));
  }, []);

  const selectPreviousResult = useCallback((historyIndex: number) => {
    setState((prev) => {
      const history = prev.regenerationHistory || [];
      if (historyIndex >= 0 && historyIndex < history.length) {
        const selectedResult = history[historyIndex];
        return {
          ...prev,
          streamedText: selectedResult.text, // streamedText도 업데이트
          accumulatedText: selectedResult.text,
          displayText: selectedResult.text,
          emotion: selectedResult.emotion,
          keywords: selectedResult.keywords,
          isEditMode: false,
          editedText: selectedResult.text,
          isTyping: false, // 타이핑 애니메이션 중지
          isComplete: true, // 완료 상태로 설정
        };
      }
      return prev;
    });
  }, []);

  const resetState = useCallback((preserveSession: boolean = false) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (streamingTypingTimeoutRef.current) {
      clearTimeout(streamingTypingTimeoutRef.current);
    }

    // ✅ Best Practice: 단순한 상태 정리
    // 큐 시스템 제거로 정리 로직 단순화

    setState((prev) => ({
      isStreaming: false,
      streamedText: '',
      accumulatedText: '',
      displayText: '',
      error: null,
      sessionId: preserveSession ? prev.sessionId : null,
      emotion: null,
      keywords: [],
      isComplete: false,
      isTyping: false,
      isEditMode: false,
      editedText: '',
      regenerationCount: 0,
      uploadedImages: null,
      regenerationHistory: preserveSession ? prev.regenerationHistory : [],
    }));
  }, []);

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      // EventSource 연결 해제
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // 모든 타이머 정리
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (streamingTypingTimeoutRef.current) {
        clearTimeout(streamingTypingTimeoutRef.current);
      }

      // ✅ Best Practice: 리소스 정리
      // 단순화된 정리 로직
    };
  }, []);

  // isPending 상태를 포함한 확장된 반환값
  return {
    ...state,
    isPending, // useTransition의 pending 상태 추가
    startStreaming,
    startRegeneration, // 재생성 스트리밍 함수 추가
    stopStreaming,
    resetState,
    setEditMode,
    updateEditedText,
    selectPreviousResult,
  };
};
