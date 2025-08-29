import {
  escapeHtml,
  validateInput,
  safeJsonParse,
  validateUrl,
  TokenBucket,
  generateCsrfToken,
  validateCsrfToken,
} from '../security';

describe('Security Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string with no special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('validateInput', () => {
    it('should accept valid input', () => {
      const input = '안녕하세요 새김입니다';
      expect(validateInput(input)).toBe(input);
    });

    it('should throw error for non-string input', () => {
      expect(() => validateInput(123 as unknown as string)).toThrow(
        '입력값은 문자열이어야 합니다.',
      );
    });

    it('should throw error for input exceeding max length', () => {
      const longInput = 'a'.repeat(1001);
      expect(() => validateInput(longInput)).toThrow(
        '입력값이 최대 길이(1000)를 초과했습니다.',
      );
    });

    it('should throw error for malicious script', () => {
      expect(() => validateInput('<script>alert("xss")</script>')).toThrow(
        '잘못된 입력이 감지되었습니다.',
      );
    });

    it('should throw error for javascript: protocol', () => {
      expect(() => validateInput('javascript:alert("xss")')).toThrow(
        '잘못된 입력이 감지되었습니다.',
      );
    });

    it('should throw error for onclick handlers', () => {
      expect(() => validateInput('onclick=alert("xss")')).toThrow(
        '잘못된 입력이 감지되었습니다.',
      );
    });

    it('should trim whitespace', () => {
      expect(validateInput('  hello world  ')).toBe('hello world');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const input = '{"name": "새김", "type": "diary"}';
      const expected = { name: '새김', type: 'diary' };
      expect(safeJsonParse(input)).toEqual(expected);
    });

    it('should return null for invalid JSON', () => {
      expect(safeJsonParse('{invalid json}')).toBeNull();
    });

    it('should return null for non-string input', () => {
      expect(safeJsonParse(undefined as unknown as string)).toBeNull();
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(validateUrl('https://saegim.com')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      expect(validateUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
    });

    it('should reject javascript: URLs', () => {
      expect(validateUrl('javascript:alert("xss")')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(validateUrl('data:text/html,<script>alert("xss")</script>')).toBe(
        false,
      );
    });
  });

  describe('TokenBucket', () => {
    it('should allow consuming tokens within capacity', () => {
      const bucket = new TokenBucket(10, 1);
      expect(bucket.consume(5)).toBe(true);
      expect(bucket.consume(5)).toBe(true);
      expect(bucket.consume(1)).toBe(false);
    });

    it('should refill tokens over time', (done) => {
      const bucket = new TokenBucket(2, 10); // 10 tokens per second

      bucket.consume(2); // Consume all tokens
      expect(bucket.consume(1)).toBe(false);

      // Wait 200ms and check if tokens are refilled
      setTimeout(() => {
        expect(bucket.consume(1)).toBe(true);
        done();
      }, 200);
    });
  });

  describe('CSRF Token', () => {
    it('should generate token with correct length', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
    });

    it('should generate different tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('should validate matching tokens', () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it('should reject non-matching tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it('should reject invalid token types', () => {
      expect(validateCsrfToken(null as unknown as string, 'valid')).toBe(false);
      expect(validateCsrfToken('valid', undefined as unknown as string)).toBe(
        false,
      );
    });
  });
});
