import { useState, useCallback, useEffect } from 'react';
import { GeneratedMessage, MessageVersion, StoredMessage } from '@/types/chat';
import { getLogger } from '@/lib/logger';

const logger = getLogger('useMessageManagement');

export const useMessageManagement = (sessionId: string) => {
  const [generatedMessages, setGeneratedMessages] = useState<
    GeneratedMessage[]
  >([]);
  const [regeneratingMessageIds, setRegeneratingMessageIds] = useState<
    Set<string>
  >(new Set());

  const generateId = useCallback(
    (): string =>
      `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    [],
  );

  // localStorage utilities
  const saveMessagesToLocalStorage = useCallback(
    (messages: GeneratedMessage[], sessionId: string): void => {
      try {
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        const messagesForStorage: StoredMessage[] = messages.map((msg) => ({
          ...msg,
          versions: msg.versions.map((version) => ({
            ...version,
            createdAt: version.createdAt.toISOString(),
          })),
        }));
        localStorage.setItem(
          localStorageKey,
          JSON.stringify(messagesForStorage),
        );
      } catch (error) {
        logger.error('localStorage 저장 실패', { error });
      }
    },
    [],
  );

  const loadMessagesFromLocalStorage = useCallback(
    (sessionId: string): GeneratedMessage[] => {
      try {
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        const savedMessages = localStorage.getItem(localStorageKey);

        if (!savedMessages) return [];

        const parsedMessages: StoredMessage[] = JSON.parse(savedMessages);
        return parsedMessages.map((msg) => ({
          ...msg,
          versions: msg.versions.map((version) => ({
            ...version,
            createdAt: new Date(version.createdAt),
            userPrompt: version.userPrompt || '',
          })),
        }));
      } catch (error) {
        logger.error('localStorage 파싱 오류', { error });
        const localStorageKey = `ai_messages_v2_${sessionId}`;
        localStorage.removeItem(localStorageKey);
        return [];
      }
    },
    [],
  );

  // Message operations
  const addNewMessage = useCallback(
    (newVersion: MessageVersion, targetSessionId: string) => {
      const newMessage: GeneratedMessage = {
        id: `msg_${generateId()}`,
        sessionId: targetSessionId,
        versions: [newVersion],
        currentVersionIndex: 0,
      };

      setGeneratedMessages((prev) => [...prev, newMessage]);
    },
    [generateId],
  );

  const addVersionToMessage = useCallback(
    (targetSessionId: string, newVersion: MessageVersion) => {
      setGeneratedMessages((prev) => {
        const messageIndex = prev.findIndex(
          (msg) => msg.sessionId === targetSessionId,
        );

        if (messageIndex === -1) {
          const newMessage: GeneratedMessage = {
            id: `msg_${generateId()}`,
            sessionId: targetSessionId,
            versions: [newVersion],
            currentVersionIndex: 0,
          };
          return [...prev, newMessage];
        } else {
          const updatedMessages = [...prev];
          const existingMessage = updatedMessages[messageIndex];
          updatedMessages[messageIndex] = {
            ...existingMessage,
            versions: [...existingMessage.versions, newVersion],
            currentVersionIndex: existingMessage.versions.length,
          };
          return updatedMessages;
        }
      });
    },
    [generateId],
  );

  // Version navigation
  const handlePreviousVersion = useCallback((messageId: string): void => {
    setGeneratedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              currentVersionIndex: Math.max(0, msg.currentVersionIndex - 1),
            }
          : msg,
      ),
    );
  }, []);

  const handleNextVersion = useCallback((messageId: string): void => {
    setGeneratedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              currentVersionIndex: Math.min(
                msg.versions.length - 1,
                msg.currentVersionIndex + 1,
              ),
            }
          : msg,
      ),
    );
  }, []);

  // Load messages on mount
  useEffect(() => {
    if (sessionId) {
      const messages = loadMessagesFromLocalStorage(sessionId);
      setGeneratedMessages(messages);
    }
  }, [sessionId, loadMessagesFromLocalStorage]);

  // Save messages when they change
  useEffect(() => {
    if (generatedMessages.length > 0 && sessionId) {
      saveMessagesToLocalStorage(generatedMessages, sessionId);
    }
  }, [generatedMessages, sessionId, saveMessagesToLocalStorage]);

  return {
    generatedMessages,
    regeneratingMessageIds,
    setRegeneratingMessageIds,
    addNewMessage,
    addVersionToMessage,
    handlePreviousVersion,
    handleNextVersion,
    generateId,
  };
};
