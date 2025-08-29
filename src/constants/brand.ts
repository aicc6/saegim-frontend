/**
 * 브랜딩 색상 상수
 * 새김(SaeGim) 브랜드 색상 팔레트 정의
 */
export const BRAND_COLORS = {
  PRIMARY: '#5C8D89',
  SECONDARY: '#7BA098',
  SAGE_20: '#f8faf9',
  SAGE_80: '#4a6662',
  SAGE_100: '#3d5350',
} as const;

/**
 * 브랜딩 에셋 경로
 */
export const BRAND_ASSETS = {
  LOGO: '/images/logoop.png',
  LOGO_ICON: '/images/logo.webp',
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;
