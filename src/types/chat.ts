import { EmotionOption } from '@/stores/emotion';
import { WritingStyle, LengthOption } from '@/stores/create';

export interface MessageVersion {
  id: string;
  text: string;
  keywords?: string[];
  emotion: EmotionOption;
  style: WritingStyle;
  length: LengthOption;
  regenerationCount: number;
  createdAt: Date;
  images?: File[];
  userPrompt: string;
}

export interface GeneratedMessage {
  id: string;
  sessionId?: string;
  versions: MessageVersion[];
  currentVersionIndex: number;
}

export interface StoredMessage {
  id: string;
  sessionId?: string;
  versions: StoredMessageVersion[];
  currentVersionIndex: number;
}

export interface StoredMessageVersion {
  id: string;
  text: string;
  keywords?: string[];
  emotion: EmotionOption;
  style: WritingStyle;
  length: LengthOption;
  regenerationCount: number;
  createdAt: string; // ISO string for localStorage
  images?: File[];
  userPrompt: string;
}

export interface RegenerateResponse {
  ai_generated_text: string;
  keywords?: string[];
  ai_emotion: string;
  style?: WritingStyle;
  length?: LengthOption;
  user_prompt?: string;
}

export interface CreateChatProps {
  sessionId: string;
}
