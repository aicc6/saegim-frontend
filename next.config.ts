import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';

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
    console.log('✅ Service Worker 환경변수 주입 완료');
  } else {
    console.error(
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

  // ESLint 설정 (빌드 중 일시적으로 무시)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript 설정 (빌드 중 일시적으로 무시)
  typescript: {
    ignoreBuildErrors: true,
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
