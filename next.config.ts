import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';

// 빌드 타임 로깅 유틸리티
const buildLog = {
  info: (message: string) => console.log(`[Next.js Build] ${message}`),
  error: (message: string, ...args: unknown[]) =>
    console.error(`[Next.js Build ERROR] ${message}`, ...args),
};

// Service Worker 환경변수 주입 함수
function injectEnvToServiceWorker() {
  const templatePath = path.join(
    process.cwd(),
    'public/firebase-messaging-sw.template.js',
  );
  const outputPath = path.join(
    process.cwd(),
    'public/firebase-messaging-sw.js',
  );

  if (fs.existsSync(templatePath)) {
    let swContent = fs.readFileSync(templatePath, 'utf8');

    // 환경변수 치환
    const envVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY:
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      NEXT_PUBLIC_FIREBASE_APP_ID:
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    };

    // 환경변수 치환
    Object.entries(envVars).forEach(([key, value]) => {
      const placeholder = `process.env.${key}`;
      swContent = swContent.replace(new RegExp(placeholder, 'g'), `'${value}'`);
    });

    fs.writeFileSync(outputPath, swContent);
    buildLog.info('✅ Service Worker 환경변수 주입 완료');
  } else {
    buildLog.error(
      '❌ Service Worker 템플릿 파일을 찾을 수 없습니다:',
      templatePath,
    );
  }
}

const nextConfig: NextConfig = {
  // Docker standalone 출력 모드 활성화
  output: 'standalone',

  // 서버 외부 패키지 설정 (Next.js 15에서 이동됨)
  serverExternalPackages: [],

  // ESLint 설정 (빌드 시 활성화)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript 설정 (빌드 시 활성화)
  typescript: {
    ignoreBuildErrors: false,
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
    ],
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // X-Frame-Options: 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options: MIME 타입 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer-Policy: 리퍼러 정보 제한
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions-Policy: 브라우저 기능 제한
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content-Security-Policy: XSS 및 기타 공격 방지
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https:",
              "connect-src 'self' http://localhost:8000 https://api.saegim.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://fcmregistrations.googleapis.com wss:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ];
  },

  // webpack 설정
  webpack: (config: unknown, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Service Worker 파일에 환경변수 주입
      const webpackConfig = config as {
        plugins: Array<{
          apply?: (compiler: {
            hooks: {
              afterEmit: {
                tap: (name: string, callback: () => void) => void;
              };
            };
          }) => void;
        }>;
      };

      webpackConfig.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap(
            'InjectEnvToServiceWorker',
            injectEnvToServiceWorker,
          );
        },
      });
    }

    return config;
  },
};

export default nextConfig;
