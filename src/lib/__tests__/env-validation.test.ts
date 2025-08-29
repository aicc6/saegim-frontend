import { validateEnvironment, getEnvVar } from '../env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should pass validation with required env vars', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.saegim.com';

      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;

      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        '필수 환경변수가 설정되지 않았습니다: NEXT_PUBLIC_API_BASE_URL',
      );
    });

    it('should warn about development default values', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.saegim.com';
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'your_firebase_api_key';

      const result = validateEnvironment();
      expect(result.warnings).toContain(
        'NEXT_PUBLIC_FIREBASE_API_KEY이 개발용 기본값으로 설정되어 있습니다.',
      );
    });

    it('should validate URL format', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'invalid-url';

      const result = validateEnvironment();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        '잘못된 URL 형식입니다: NEXT_PUBLIC_API_BASE_URL',
      );
    });
  });

  describe('getEnvVar', () => {
    it('should return env var value when it exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback when env var does not exist', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR', 'fallback')).toBe('fallback');
    });

    it('should throw error when env var does not exist and no fallback', () => {
      delete process.env.TEST_VAR;
      expect(() => getEnvVar('TEST_VAR')).toThrow(
        '환경변수 TEST_VAR이 설정되지 않았습니다.',
      );
    });
  });
});
