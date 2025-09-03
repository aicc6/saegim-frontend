/**
 * 서버 검증 에러를 React Hook Form 필드 에러로 변환하는 유틸리티
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ServerValidationError {
  type: string;
  loc: string[];
  msg: string;
  input?: unknown;
  ctx?: unknown;
  url?: string;
}

/**
 * 422 Unprocessable Entity 에러를 파싱하여 필드별 검증 에러로 변환
 * @param error API 에러 객체
 * @returns 필드별 검증 에러 배열
 */
export function parse422Error(error: unknown): ValidationError[] {
  try {
    const detail = (error as { response?: { data?: { detail?: unknown } } })
      ?.response?.data?.detail;

    if (!detail || !Array.isArray(detail)) {
      return [];
    }

    return detail.map((item: ServerValidationError) => {
      // loc 배열에서 마지막 요소가 실제 필드명
      // 예: ["body", "nickname"] -> "nickname"
      const field = item.loc?.[item.loc.length - 1] || 'unknown';

      // 메시지에서 "Value error, " 접두사 제거
      const message =
        item.msg?.replace(/^Value error,\s*/, '') || '유효하지 않은 값입니다.';

      return {
        field,
        message,
      };
    });
  } catch (parseError) {
    console.error('422 에러 파싱 실패:', parseError);
    return [];
  }
}

/**
 * HTTP 상태 코드가 422인지 확인
 * @param error API 에러 객체
 * @returns 422 에러 여부
 */
export function is422Error(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } })?.response?.status === 422
  );
}
