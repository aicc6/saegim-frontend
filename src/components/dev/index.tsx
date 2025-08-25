/**
 * 개발 및 테스트용 컴포넌트 내보내기
 */

export { default as FCMTestPanel } from './fcm-test-panel';
export { default as FCMManager } from './fcm-manager';

// 개발 환경에서만 사용할 수 있도록 체크하는 유틸리티
export const isDevelopment = () => {
  return (
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  );
};

// 개발 컴포넌트 래퍼 - 프로덕션에서는 렌더링하지 않음
export const DevOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (!isDevelopment()) {
    return null;
  }

  return <>{children}</>;
};
