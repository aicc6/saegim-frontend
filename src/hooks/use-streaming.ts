'use client';

import { useState, useCallback, useRef } from 'react';
import { getLogger } from '@/lib/logger';

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
}

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

  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 스트리밍 타이핑 애니메이션 함수
  const startStreamingTypingAnimation = useCallback(
    (newContent: string) => {
      const currentDisplayLength = state.displayText.length;
      const targetText = state.streamedText + newContent;

      let currentIndex = currentDisplayLength;
      const typeNextChar = () => {
        if (currentIndex < targetText.length) {
          setState((prev) => ({
            ...prev,
            displayText: targetText.slice(0, currentIndex + 1),
          }));
          currentIndex++;
          streamingTypingTimeoutRef.current = setTimeout(typeNextChar, 20); // 20ms 간격으로 더 빠른 타이핑
        }
      };

      typeNextChar();
    },
    [state.displayText.length, state.streamedText],
  );

  // 완료 후 타이핑 애니메이션 함수
  const startTypingAnimation = useCallback((fullText: string) => {
    setState((prev) => ({ ...prev, isTyping: true, displayText: '' }));

    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setState((prev) => ({
          ...prev,
          displayText: fullText.slice(0, currentIndex + 1),
        }));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 30); // 30ms 간격으로 타이핑
      } else {
        setState((prev) => ({ ...prev, isTyping: false }));
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

        // 초기 상태 설정
        setState((prev) => ({
          ...prev,
          isStreaming: true,
          streamedText: '',
          accumulatedText: '',
          displayText: '',
          error: null,
          sessionId: prev.sessionId || null,
          emotion: null,
          keywords: [],
          isComplete: false,
          isTyping: false,
          isEditMode: false,
          editedText: '',
        }));

        // 이미지 업로드 처리 (있는 경우)
        let uploadedImages = null;
        if (data.images && data.images.length > 0) {
          try {
            const formData = new FormData();
            data.images.forEach((image) => {
              formData.append(`images`, image);
            });

            const imageUploadResponse = await fetch(
              'http://localhost:8000/api/diary/images/upload',
              {
                method: 'POST',
                body: formData,
                credentials: 'include',
              },
            );

            if (imageUploadResponse.ok) {
              const imageResult = await imageUploadResponse.json();
              uploadedImages = imageResult.data;

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

        // JSON 형식 요청 데이터 생성
        const requestData = {
          prompt: data.prompt,
          style: data.style,
          length: data.length,
          emotion: data.emotion || '',
          session_id: data.sessionId || undefined,
          uploaded_images: uploadedImages,
        };

        // 스트리밍 요청 시작
        const response = await fetch(
          'http://localhost:8000/api/ai/generate/stream',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            credentials: 'include',
          },
        );

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

                    case 'content':
                      setState((prev) => ({
                        ...prev,
                        streamedText:
                          prev.streamedText + (parsedData.content || ''),
                        accumulatedText:
                          parsedData.accumulated || prev.accumulatedText,
                      }));
                      // 새로운 콘텐츠로 스트리밍 타이핑 애니메이션 시작
                      startStreamingTypingAnimation(parsedData.content || '');
                      break;

                    case 'complete':
                      setState((prev) => {
                        const finalText =
                          parsedData.generated_text || prev.accumulatedText;
                        const newRegenerationCount =
                          parsedData.regeneration_count || 0;

                        // 재생성 이력에 현재 결과 추가
                        const newHistoryEntry = {
                          text: finalText,
                          emotion: parsedData.emotion || null,
                          keywords: parsedData.keywords || [],
                          timestamp: Date.now(),
                        };

                        // 즉시 타이핑 애니메이션 시작 (ChatGPT 스타일)
                        startTypingAnimation(finalText);

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

                      logger.info('스트리밍 완료', {
                        emotion: parsedData.emotion,
                        tokensUsed: parsedData.tokens_used,
                      });
                      break;

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
    [startStreamingTypingAnimation, startTypingAnimation],
  );

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

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
          accumulatedText: selectedResult.text,
          displayText: selectedResult.text,
          emotion: selectedResult.emotion,
          keywords: selectedResult.keywords,
          isEditMode: false,
          editedText: selectedResult.text,
        };
      }
      return prev;
    });
  }, []);

  const resetState = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (streamingTypingTimeoutRef.current) {
      clearTimeout(streamingTypingTimeoutRef.current);
    }
    setState({
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
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    resetState,
    setEditMode,
    updateEditedText,
    selectPreviousResult,
  };
};
