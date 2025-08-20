'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ===== 타입 정의 =====
export type WritingStyle = '시' | '단편글';
export type LengthOption = '단문' | '중문' | '장문';
export type EmotionOption = string;

// API 관련 타입
export interface AIGenerateRequest {
  prompt: string;
  style: WritingStyle;
  length: LengthOption;
  emotion: EmotionOption;
  user_id?: string;
}

export interface AIGenerateResponse {
  id: string;
  content: string;
  ai_generated_text: string;
  ai_emotion?: EmotionOption;
  ai_emotion_confidence?: number;
  keywords: string[];
  created_at: string;
}

// 세션 관리 타입
export interface ChatSession {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message_type: 'user' | 'ai';
  content: string;
  metadata?: {
    style?: WritingStyle;
    length?: LengthOption;
    emotion?: EmotionOption;
    keywords?: string[];
    ai_emotion?: EmotionOption;
    ai_emotion_confidence?: number;
  };
  created_at: string;
  // 재생성 관련 필드
  regeneration_history?: string[]; // 이전 생성 결과들
  current_version?: number; // 현재 보고 있는 버전 (0: 원본, 1-4: 재생성)
  max_regenerations?: number; // 최대 재생성 횟수
}

// 설정 타입들
export interface StyleOption {
  value: WritingStyle;
  label: string;
  displayName: string;
}

export interface LengthConfig {
  value: LengthOption;
  label: string;
  displayName: string;
}

export interface CreateConfig {
  styles: StyleOption[];
  lengths: LengthConfig[];
}

interface CreateState {
  // 설정
  config: CreateConfig;

  // 입력 상태
  prompt: string;
  style: WritingStyle;
  length: LengthOption;

  // 생성 상태
  isGenerating: boolean;

  // 세션 상태 (generatedResults와 통합)
  currentSessionId: string | null;
  sessionTitle: string | null;
  chatMessages: ChatMessage[];
  isLoadingSession: boolean;

  // 에러 상태
  error: string | null;

  // 기본 액션
  setPrompt: (prompt: string) => void;
  setStyle: (style: WritingStyle) => void;
  setLength: (length: LengthOption) => void;
  clearError: () => void;

  // API 액션
  generateText: (emotion?: EmotionOption) => Promise<void>;
  regenerateText: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;

  // 재생성 네비게이션
  navigateRegenerationHistory: (
    messageId: string,
    direction: 'prev' | 'next',
  ) => void;

  // 세션 관리 액션
  createSession: (
    initialPrompt: string,
    emotion?: EmotionOption,
  ) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (title: string) => Promise<void>;
  clearSession: () => void;
  generateInSession: (emotion?: EmotionOption) => Promise<void>;

  // 유틸리티
  getStyleDisplayName: (style: WritingStyle) => string;
  getLengthDisplayName: (length: LengthOption) => string;
  getAIMessages: () => ChatMessage[];
}

// ===== API 에러 처리 =====
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ===== Mock 컨텐츠 생성기 =====
class MockContentGenerator {
  static generate(
    prompt: string,
    style: WritingStyle,
    length: LengthOption,
    emotion: EmotionOption,
  ): string {
    const trimmed = prompt.trim();
    if (!trimmed) return '';

    const emotionTone = emotion || '조용한';

    if (style === '시') {
      return this.generatePoem(trimmed, length, emotionTone);
    }

    return this.generateProse(trimmed, length, emotionTone);
  }

  private static generatePoem(
    prompt: string,
    length: LengthOption,
    tone: string,
  ): string {
    const linesCount = { 단문: 3, 중문: 5, 장문: 7 }[length];
    const lines: string[] = [];

    for (let i = 0; i < linesCount; i++) {
      if (i === 0) lines.push(`${prompt} 위로`);
      else if (i === 1) lines.push(`${tone} 마음이 스며들고`);
      else if (i === linesCount - 1) lines.push(`오늘의 나를 조심스레 새긴다`);
      else lines.push(`사이사이 숨을 고르며, ${prompt}을(를) 떠올린다`);
    }

    return lines.join('\n');
  }

  private static generateProse(
    prompt: string,
    length: LengthOption,
    tone: string,
  ): string {
    const sentencesCount = { 단문: 2, 중문: 3, 장문: 4 }[length];
    const sentences: string[] = [];

    for (let i = 0; i < sentencesCount; i++) {
      if (i === 0) {
        sentences.push(
          `${prompt}에 대해 생각해 본다. ${tone} 감정이 가볍게 배어 나온다.`,
        );
      } else if (i === sentencesCount - 1) {
        sentences.push(
          '나는 오늘의 감정을 조용히 기록한다. 그리고 그 안에서 작은 나를 다시 발견한다.',
        );
      } else {
        sentences.push(
          `사소한 기척들 속에서 ${prompt}은(는) 형태를 바꾸고, 나도 조금은 달라진다.`,
        );
      }
    }

    return sentences.join(' ');
  }

  static extractKeywords(prompt: string): string[] {
    return prompt
      .split(/[,\s]+/)
      .filter((word) => word.length > 1)
      .slice(0, 5);
  }
}

// ===== 기본 설정 =====
const DEFAULT_CONFIG: CreateConfig = {
  styles: [
    { value: '시', label: '시', displayName: 'poem' },
    { value: '단편글', label: '단편글', displayName: 'prose' },
  ],
  lengths: [
    { value: '단문', label: '단문', displayName: 'short' },
    { value: '중문', label: '중문', displayName: 'medium' },
    { value: '장문', label: '장문', displayName: 'long' },
  ],
};

// ===== API 함수들 (간소화) =====
async function generateAIText(
  request: AIGenerateRequest,
): Promise<AIGenerateResponse> {
  // TODO: 백엔드 준비 후 실제 API 호출로 대체
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 400),
  );

  const content = MockContentGenerator.generate(
    request.prompt,
    request.style,
    request.length,
    request.emotion,
  );

  return {
    id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    ai_generated_text: content,
    ai_emotion: request.emotion || 'peaceful',
    ai_emotion_confidence: 0.85 + Math.random() * 0.1,
    keywords: MockContentGenerator.extractKeywords(request.prompt),
    created_at: new Date().toISOString(),
  };
}

async function createChatSession(
  initialPrompt: string,
  style: WritingStyle,
  length: LengthOption,
  emotion?: EmotionOption,
): Promise<ChatSession> {
  // TODO: 백엔드 준비 후 실제 API 호출로 대체
  await new Promise((resolve) => setTimeout(resolve, 300));

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const title =
    initialPrompt.length > 30
      ? `${initialPrompt.substring(0, 30)}...`
      : initialPrompt;

  return {
    id: sessionId,
    title,
    user_id: 'mock_user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 0,
  };
}

async function loadChatSession(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
}> {
  // TODO: 백엔드 준비 후 실제 API 호출로 대체
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    session: {
      id: sessionId,
      title: '이전 대화',
      user_id: 'mock_user',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 2,
    },
    messages: [
      {
        id: 'msg_1',
        session_id: sessionId,
        message_type: 'user',
        content: '바람과 나무에 대한 시를 써줘',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'msg_2',
        session_id: sessionId,
        message_type: 'ai',
        content:
          '바람과 나무에 대해 생각해 본다.\n조용한 감정이 가볍게 배어 나온다.\n나는 오늘의 감정을 조용히 기록한다.',
        metadata: {
          style: '시',
          length: '단문',
          emotion: 'peaceful',
          keywords: ['바람', '나무'],
        },
        created_at: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
  };
}

async function addMessageToSession(
  sessionId: string,
  content: string,
  messageType: 'user' | 'ai',
  metadata?: ChatMessage['metadata'],
): Promise<ChatMessage> {
  // TODO: 백엔드 준비 후 실제 API 호출로 대체
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    session_id: sessionId,
    message_type: messageType,
    content,
    metadata,
    created_at: new Date().toISOString(),
  };
}

async function updateSessionTitle(
  sessionId: string,
  title: string,
): Promise<void> {
  // TODO: 백엔드 준비 후 실제 API 호출로 대체
  await new Promise((resolve) => setTimeout(resolve, 200));
}

// ===== Zustand 스토어 =====
export const useCreateStore = create<CreateState>()(
  persist(
    immer((set, get) => ({
      // 초기 상태
      config: DEFAULT_CONFIG,
      prompt: '',
      style: '시',
      length: '단문',
      isGenerating: false,
      error: null,

      // 세션 상태
      currentSessionId: null,
      sessionTitle: null,
      chatMessages: [],
      isLoadingSession: false,

      // 기본 액션들
      setPrompt: (prompt) =>
        set((state) => {
          state.prompt = prompt;
        }),
      setStyle: (style) =>
        set((state) => {
          state.style = style;
        }),
      setLength: (length) =>
        set((state) => {
          state.length = length;
        }),
      clearError: () =>
        set((state) => {
          state.error = null;
        }),

      // 텍스트 생성 (단독 사용)
      generateText: async (emotion?: EmotionOption) => {
        const { prompt, style, length } = get();
        if (!prompt.trim()) return;

        set((state) => {
          state.isGenerating = true;
          state.error = null;
        });

        try {
          const response = await generateAIText({
            prompt: prompt.trim(),
            style,
            length,
            emotion: emotion || '',
          });

          // 새 세션으로 시작
          const session = await createChatSession(
            prompt.trim(),
            style,
            length,
            emotion,
          );
          const userMessage = await addMessageToSession(
            session.id,
            prompt.trim(),
            'user',
          );
          const aiMessage = await addMessageToSession(
            session.id,
            response.ai_generated_text,
            'ai',
            {
              style,
              length,
              emotion,
              keywords: response.keywords,
              ai_emotion: response.ai_emotion,
              ai_emotion_confidence: response.ai_emotion_confidence,
            },
          );

          // 재생성 관련 초기화
          aiMessage.regeneration_history = [];
          aiMessage.current_version = 0;
          aiMessage.max_regenerations = 5;

          set((state) => {
            state.currentSessionId = session.id;
            state.sessionTitle = session.title;
            state.chatMessages = [userMessage, aiMessage];
            state.prompt = '';
            state.isGenerating = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '텍스트 생성 중 오류가 발생했습니다.';
          set((state) => {
            state.error = errorMessage;
            state.isGenerating = false;
          });
        }
      },

      // 재생성 (최대 5번까지, 히스토리 관리)
      regenerateText: async (messageId: string) => {
        const { chatMessages, style, length } = get();
        const targetMessage = chatMessages.find((msg) => msg.id === messageId);
        if (!targetMessage || targetMessage.message_type !== 'ai') return;

        // 최대 재생성 횟수 확인
        const currentHistory = targetMessage.regeneration_history || [];
        const maxRegenerations = targetMessage.max_regenerations || 5;

        if (currentHistory.length >= maxRegenerations) {
          set((state) => {
            state.error = `최대 ${maxRegenerations}번까지만 재생성할 수 있습니다.`;
          });
          return;
        }

        // 해당 AI 메시지의 직전 사용자 메시지 찾기
        const messageIndex = chatMessages.findIndex(
          (msg) => msg.id === messageId,
        );
        const userMessage = chatMessages[messageIndex - 1];
        if (!userMessage || userMessage.message_type !== 'user') return;

        set((state) => {
          state.isGenerating = true;
          state.error = null;
        });

        try {
          const response = await generateAIText({
            prompt: userMessage.content,
            style: targetMessage.metadata?.style || style,
            length: targetMessage.metadata?.length || length,
            emotion: targetMessage.metadata?.emotion || '',
          });

          set((state) => {
            const msgIndex = state.chatMessages.findIndex(
              (msg) => msg.id === messageId,
            );
            if (msgIndex !== -1) {
              const message = state.chatMessages[msgIndex];

              // 현재 내용을 히스토리에 추가 (첫 재생성일 때만)
              if (!message.regeneration_history) {
                message.regeneration_history = [message.content];
                message.current_version = 0;
                message.max_regenerations = 5;
              }

              // 새로운 생성 결과를 히스토리에 추가
              message.regeneration_history.push(response.ai_generated_text);
              message.current_version = message.regeneration_history.length - 1;

              // 현재 표시되는 내용 업데이트
              message.content = response.ai_generated_text;
              message.metadata = {
                ...message.metadata,
                keywords: response.keywords,
                ai_emotion: response.ai_emotion,
                ai_emotion_confidence: response.ai_emotion_confidence,
              };
            }
            state.isGenerating = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '텍스트 재생성 중 오류가 발생했습니다.';
          set((state) => {
            state.error = errorMessage;
            state.isGenerating = false;
          });
        }
      },

      // 메시지 삭제
      deleteMessage: (messageId) => {
        set((state) => {
          const messageIndex = state.chatMessages.findIndex(
            (msg) => msg.id === messageId,
          );
          if (messageIndex !== -1) {
            // AI 메시지 삭제 시 직전 사용자 메시지도 함께 삭제
            const message = state.chatMessages[messageIndex];
            if (message.message_type === 'ai' && messageIndex > 0) {
              const prevMessage = state.chatMessages[messageIndex - 1];
              if (prevMessage.message_type === 'user') {
                state.chatMessages.splice(messageIndex - 1, 2);
              } else {
                state.chatMessages.splice(messageIndex, 1);
              }
            } else {
              state.chatMessages.splice(messageIndex, 1);
            }
          }
        });
      },

      // 세션 생성 (generateText와 통합됨)
      createSession: async (initialPrompt, emotion) => {
        return get()
          .generateText(emotion)
          .then(() => get().currentSessionId || '');
      },

      // 세션 로드
      loadSession: async (sessionId) => {
        set((state) => {
          state.isLoadingSession = true;
          state.error = null;
        });

        try {
          const { session, messages } = await loadChatSession(sessionId);

          set((state) => {
            state.currentSessionId = session.id;
            state.sessionTitle = session.title;
            state.chatMessages = messages;
            state.isLoadingSession = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '세션 로드 중 오류가 발생했습니다.';
          set((state) => {
            state.error = errorMessage;
            state.isLoadingSession = false;
          });
        }
      },

      // 세션 제목 업데이트
      updateSessionTitle: async (title) => {
        const { currentSessionId } = get();
        if (!currentSessionId) return;

        try {
          await updateSessionTitle(currentSessionId, title);
          set((state) => {
            state.sessionTitle = title;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '세션 제목 업데이트 중 오류가 발생했습니다.';
          set((state) => {
            state.error = errorMessage;
          });
        }
      },

      // 세션 초기화
      clearSession: () => {
        set((state) => {
          state.currentSessionId = null;
          state.sessionTitle = null;
          state.chatMessages = [];
          state.prompt = '';
        });
      },

      // 세션 내 추가 생성
      generateInSession: async (emotion) => {
        const { prompt, style, length, currentSessionId } = get();
        if (!prompt.trim() || !currentSessionId) return;

        set((state) => {
          state.isGenerating = true;
          state.error = null;
        });

        try {
          const userMessage = await addMessageToSession(
            currentSessionId,
            prompt.trim(),
            'user',
          );

          const aiResponse = await generateAIText({
            prompt: prompt.trim(),
            style,
            length,
            emotion: emotion || '',
          });

          const aiMessage = await addMessageToSession(
            currentSessionId,
            aiResponse.ai_generated_text,
            'ai',
            {
              style,
              length,
              emotion,
              keywords: aiResponse.keywords,
              ai_emotion: aiResponse.ai_emotion,
              ai_emotion_confidence: aiResponse.ai_emotion_confidence,
            },
          );

          // 재생성 관련 초기화
          aiMessage.regeneration_history = [];
          aiMessage.current_version = 0;
          aiMessage.max_regenerations = 5;

          set((state) => {
            state.chatMessages.push(userMessage, aiMessage);
            state.prompt = '';
            state.isGenerating = false;
          });
        } catch (error) {
          const errorMessage =
            error instanceof APIError
              ? error.message
              : '메시지 생성 중 오류가 발생했습니다.';
          set((state) => {
            state.error = errorMessage;
            state.isGenerating = false;
          });
        }
      },

      // 재생성 히스토리 네비게이션
      navigateRegenerationHistory: (messageId, direction) => {
        set((state) => {
          const msgIndex = state.chatMessages.findIndex(
            (msg) => msg.id === messageId,
          );
          if (msgIndex === -1) return;

          const message = state.chatMessages[msgIndex];
          if (
            !message.regeneration_history ||
            message.regeneration_history.length <= 1
          )
            return;

          const currentVersion = message.current_version || 0;
          let newVersion = currentVersion;

          if (direction === 'prev' && currentVersion > 0) {
            newVersion = currentVersion - 1;
          } else if (
            direction === 'next' &&
            currentVersion < message.regeneration_history.length - 1
          ) {
            newVersion = currentVersion + 1;
          }

          if (newVersion !== currentVersion) {
            message.current_version = newVersion;
            message.content = message.regeneration_history[newVersion];
          }
        });
      },

      // 유틸리티 함수들
      getStyleDisplayName: (style) => {
        const { config } = get();
        return (
          config.styles.find((s) => s.value === style)?.displayName || style
        );
      },
      getLengthDisplayName: (length) => {
        const { config } = get();
        return (
          config.lengths.find((l) => l.value === length)?.displayName || length
        );
      },
      getAIMessages: () => {
        const { chatMessages } = get();
        return chatMessages.filter((msg) => msg.message_type === 'ai');
      },
    })),
    {
      name: 'create-store',
      partialize: (state) => ({
        style: state.style,
        length: state.length,
        currentSessionId: state.currentSessionId,
        sessionTitle: state.sessionTitle,
        chatMessages: state.chatMessages.slice(-50), // 최근 50개 메시지만 유지
      }),
    },
  ),
);
