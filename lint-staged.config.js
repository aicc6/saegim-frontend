/**
 * Lint-staged configuration for Saegim Frontend
 * 커밋 전 staged 파일에 대해 자동 포맷팅 및 린트를 수행합니다.
 */

module.exports = {
  // TypeScript, JavaScript, React 파일들
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix', // ESLint로 코드 품질 검사 및 자동 수정
    'prettier --write', // Prettier로 코드 포맷팅
    // lint-staged v16+에서는 수정된 파일이 자동으로 스테이징됩니다
  ],

  // 스타일 및 마크다운 파일들
  '*.{css,scss,md,json}': [
    'prettier --write', // Prettier로 포맷팅
  ],

  // 패키지 설정 파일들 (JSON은 위에서 이미 처리되므로 제거)
  '*.{yaml,yml}': ['prettier --write'],
};
