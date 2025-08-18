import type { NextConfig } from 'next';

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
    // Docker 환경에서의 이미지 최적화
    unoptimized: false,
    domains: [],
  },
};

export default nextConfig;
