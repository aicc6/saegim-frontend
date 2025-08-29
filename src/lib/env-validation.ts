/**
 * 환경변수 검증 유틸리티
 */

interface EnvConfig {
  name: string;
  required: boolean;
  sensitive: boolean;
}

const ENV_CONFIGS: EnvConfig[] = [
  // Public 환경변수
  { name: 'NEXT_PUBLIC_API_BASE_URL', required: true, sensitive: false },
  { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', required: false, sensitive: true },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    required: false,
    sensitive: false,
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    required: false,
    sensitive: false,
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    required: false,
    sensitive: false,
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    required: false,
    sensitive: true,
  },
  { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', required: false, sensitive: true },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    required: false,
    sensitive: true,
  },
  { name: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY', required: false, sensitive: true },

  // Private 환경변수
  { name: 'GOOGLE_REDIRECT_URI', required: false, sensitive: true },
];

export function validateEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  ENV_CONFIGS.forEach(({ name, required, sensitive }) => {
    const value = process.env[name];

    if (required && !value) {
      errors.push(`필수 환경변수가 설정되지 않았습니다: ${name}`);
    }

    if (value) {
      // 민감한 정보가 기본값으로 설정되었는지 확인
      if (
        sensitive &&
        (value.includes('your_') ||
          value.includes('localhost') ||
          value === 'development')
      ) {
        warnings.push(`${name}이 개발용 기본값으로 설정되어 있습니다.`);
      }

      // URL 형식 검증
      if (name.includes('URL') || name.includes('DOMAIN')) {
        try {
          new URL(value);
        } catch {
          errors.push(`잘못된 URL 형식입니다: ${name}`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// 안전한 환경변수 접근
export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`환경변수 ${name}이 설정되지 않았습니다.`);
  }

  return value;
}

// 개발 모드에서만 환경변수 검증 실행
if (process.env.NODE_ENV === 'development') {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error('❌ 환경변수 검증 실패:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  환경변수 경고:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ 환경변수 검증 완료');
  }
}
