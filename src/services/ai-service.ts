import { apiClient } from '@/lib/api';
import { getLogger } from '@/lib/logger';
import { createAsyncAction } from '@/lib/store-helpers';

const logger = getLogger('ai-service');

// API 타입 정의
export interface AIGenerationRequest {
  prompt: string;
  style: string;
  length: string;
  emotion?: string;
  regeneration_count?: number;
  sessionId?: string;
  images?: File[];
}

export interface AIGenerationResult {
  ai_generated_text: string;
  ai_emotion: string;
  ai_emotion_confidence: number;
  keywords: string[];
  tokens_used: number;
  session_id: string;
}

// AI 서비스 클래스
export class AIService {
  static async generateText(
    params: AIGenerationRequest,
  ): Promise<AIGenerationResult> {
    try {
      const {
        prompt,
        style,
        length,
        emotion = '',
        regeneration_count = 0,
        sessionId,
        images,
      } = params;

      // API 요청 본문 구성
      const requestBody: Record<string, unknown> = {
        prompt,
        style,
        length,
        emotion,
        regeneration_count,
      };

      // sessionId가 있을 때만 추가 (백엔드 호환성을 위해 둘 다 전송)
      if (sessionId) {
        requestBody.sessionId = sessionId;
        requestBody.session_id = sessionId;
      }

      // images가 있을 때만 추가
      if (images && images.length > 0) {
        requestBody.images = images;
      }

      // 디버깅: 재생성 요청 시 로깅
      if (regeneration_count > 1) {
        logger.debug('재생성 요청 - 백엔드로 전달되는 정보', {
          url: '/api/ai/generate',
          method: 'POST',
          requestBody,
          regeneration_count,
          sessionId: sessionId || '없음',
          hasImages: images && images.length > 0,
        });
      }

      const response = await apiClient.post<AIGenerationResult>(
        '/api/ai/generate',
        requestBody,
      );

      // 성공 로깅
      if (regeneration_count > 1) {
        logger.info('재생성 API 호출 성공', {
          response_status: 'success',
          session_id: response.data.session_id,
          ai_generated_text_length:
            response.data.ai_generated_text?.length || 0,
          regeneration_count,
        });
      }

      return response.data;
    } catch (error) {
      // 재생성 요청 실패 시 상세 로깅
      if (params.regeneration_count && params.regeneration_count > 1) {
        logger.error('재생성 요청 실패 상세', {
          error_type: 'API_CALL_FAILED',
          regeneration_count: params.regeneration_count,
          sessionId: params.sessionId || '없음',
          request_params: {
            prompt: params.prompt?.substring(0, 50) + '...',
            style: params.style,
            length: params.length,
            emotion: params.emotion,
          },
          error_message: error instanceof Error ? error.message : String(error),
        });

        // 422 오류 시 상세 분석
        if (error instanceof Error && error.message.includes('422')) {
          logger.error('422 오류 상세 분석', {
            error_type: 'VALIDATION_ERROR',
            http_status: 422,
            request_body: {
              prompt: params.prompt,
              style: params.style,
              length: params.length,
              emotion: params.emotion,
              regeneration_count: params.regeneration_count,
              sessionId: params.sessionId,
              images: params.images ? `${params.images.length}개` : '없음',
            },
            validation_issues: '백엔드에서 데이터 검증 실패',
          });
        }
      }

      throw error;
    }
  }

  static async getOriginalUserInput(sessionId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `/api/ai/session/${sessionId}/original-input`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data?.original_input || null;
    } catch (error) {
      logger.error('원본 사용자 입력 조회 실패', { error });
      return null;
    }
  }
}

// 래핑된 비동기 액션들
export const aiActions = {
  generateText: createAsyncAction(AIService.generateText, 'AI 텍스트 생성'),

  getOriginalUserInput: createAsyncAction(
    AIService.getOriginalUserInput,
    '원본 입력 조회',
  ),
};
