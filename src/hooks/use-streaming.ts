'use client';

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import { flushSync } from 'react-dom';
import { getLogger } from '@/lib/logger';
import { imageApi } from '@/lib/api/image';
import { aiApi } from '@/lib/api/ai';

const logger = getLogger('useStreaming');

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

  // ChatGPT 스타일 타이핑 애니메이션 함수 (완료 후에만 사용)
  const startTypingAnimation = useCallback((fullText: string) => {
    // 기존 타이핑 애니메이션 중단
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // displayText를 빈 문자열로 초기화하고 타이핑 시작
    setState((prev) => ({ ...prev, isTyping: true, displayText: '' }));

    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        const currentText = fullText.slice(0, currentIndex + 1);
        flushSync(() => {
          setState((prev) => ({
            ...prev,
            displayText: currentText,
          }));
        });
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 100); // 100ms 간격 (더 잘 보이는 타이핑 속도)
      } else {
        flushSync(() => {
          setState((prev) => ({ ...prev, isTyping: false }));
        });
      }
    };

    typeNextChar();
  }, []);

  const startStreaming = useCallback(
    async (data: {
      prompt: string;
      style: string;
      length: string;
      emotion?: string;
      sessionId?: string;
      images?: File[];
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
          uploaded_images: uploadedImages,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('응답 본문이 없습니다.');
        }

        // ReadableStream 처리
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // 'data: ' 제거
                if (jsonData.trim()) {
                  const parsedData: StreamChunk = JSON.parse(jsonData);

                  switch (parsedData.type) {
                    case 'start':
                      setState((prev) => ({
                        ...prev,
                        sessionId: parsedData.session_id || null,
                      }));
                      logger.info('스트리밍 시작', {
                        sessionId: parsedData.session_id,
                      });
                      break;

                    case 'content': {
                      const newContent = parsedData.content || '';

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
                      // 스트리밍 완료 후 바로 타이핑 애니메이션 시작
                      setTimeout(() => {
                        startTypingAnimation(finalText);
                      }, 100);

                      logger.info('스트리밍 완료', {
                        emotion: parsedData.emotion,
                        tokensUsed: parsedData.tokens_used,
                      });
                      break;
                    }

                    case 'error':
                      setState((prev) => ({
                        ...prev,
                        isStreaming: false,
                        error:
                          parsedData.error || '알 수 없는 오류가 발생했습니다.',
                      }));
                      logger.error('스트리밍 오류', {
                        error: parsedData.error,
                      });
                      break;
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
    [startTypingAnimation, appendStreamText, state.accumulatedText],
  );

  // 최적화된 스트리밍 중단 함수
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
    stopStreaming,
    resetState,
    setEditMode,
    updateEditedText,
    selectPreviousResult,
  };
};
