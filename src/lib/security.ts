/**
 * 보안 관련 유틸리티 함수
 */

// XSS 방지를 위한 HTML 인코딩
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 입력값 검증
export function validateInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('입력값은 문자열이어야 합니다.');
  }

  if (input.length > maxLength) {
    throw new Error(`입력값이 최대 길이(${maxLength})를 초과했습니다.`);
  }

  // 악성 스크립트 패턴 감지
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(input)) {
      throw new Error('잘못된 입력이 감지되었습니다.');
    }
  }

  return input.trim();
}

// 안전한 JSON 파싱
export function safeJsonParse<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

// 안전한 URL 검증
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Rate limiting을 위한 간단한 토큰 버킷
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokensRequested: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// CSRF 토큰 생성 및 검증
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function validateCsrfToken(
  token: string,
  expectedToken: string,
): boolean {
  if (typeof token !== 'string' || typeof expectedToken !== 'string') {
    return false;
  }

  if (token.length !== expectedToken.length) {
    return false;
  }

  // Timing attack 방지를 위한 상수 시간 비교
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}
