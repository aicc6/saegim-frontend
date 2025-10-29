// Firebase 초기화 및 FCM 설정
import { initializeApp, getApps } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from 'firebase/messaging';
import { getLogger } from './logger';

const logger = getLogger('firebase');

// UserAgentData 타입 정의 (실험적 웹 API)
interface NavigatorUABrandVersion {
  brand: string;
  version: string;
}

interface NavigatorUAData {
  brands: NavigatorUABrandVersion[];
  mobile: boolean;
  platform: string;
}

// Navigator 인터페이스 확장
declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

// Firebase 설정 (환경변수에서 가져옴)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화 (중복 초기화 방지)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// FCM 지원 여부 확인 및 messaging 인스턴스 생성
let messaging: ReturnType<typeof getMessaging> | null = null;
let messagingInitialized = false;

// 브라우저 환경에서만 messaging 초기화
if (typeof window !== 'undefined') {
  // 네트워크 연결 상태 확인
  logger.info('브라우저 환경 감지됨 - FCM 초기화 시작');
  logger.debug('네트워크 상태:', {
    onLine: navigator.onLine,
    userAgent: navigator.userAgent.substring(0, 100),
    cookieEnabled: navigator.cookieEnabled,
  });

  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
        messagingInitialized = true;
        logger.info('Firebase Messaging 초기화 완료');

        // Service Worker 등록 상태 확인
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            logger.debug(
              `Service Worker 등록 상태: ${registrations.length}개 등록됨`,
            );
            registrations.forEach((registration, index) => {
              logger.debug(`SW ${index + 1}: ${registration.scope}`);
            });
          });
        }

        // 네트워크 상태 변경 감지
        window.addEventListener('online', () => {
          logger.debug('네트워크 연결됨 - FCM 재연결 확인');
        });

        window.addEventListener('offline', () => {
          logger.debug('네트워크 연결 끊어짐 - FCM 기능 제한됨');
        });
      } else {
        logger.warn('FCM이 지원되지 않는 브라우저입니다.');
        logger.warn('브라우저 지원 상태:', {
          serviceWorker: 'serviceWorker' in navigator,
          pushManager: 'PushManager' in window,
          notification: 'Notification' in window,
        });
      }
    })
    .catch((error) => {
      logger.error('FCM 지원 확인 중 오류:', error);
      logger.error('오류 세부사항:', {
        name: error.name,
        message: error.message,
      });
    });
}

// FCM 토큰 생성 함수 (로그인 상태와 무관)
export const requestFCMToken = async (): Promise<string | null> => {
  // messaging 인스턴스가 초기화될 때까지 대기
  if (!messagingInitialized) {
    logger.debug('FCM 초기화를 기다리는 중...');

    // 최대 5초간 초기화 대기
    for (let i = 0; i < 50; i++) {
      if (messagingInitialized && messaging) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!messagingInitialized || !messaging) {
      logger.warn('FCM이 지원되지 않는 환경이거나 초기화에 실패했습니다.');
      return null;
    }
  }

  try {
    // VAPID 키는 환경변수에서 가져옴
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID 키가 설정되지 않았습니다.');
    }

    logger.debug('FCM 토큰 요청 시작...');
    const token = await getToken(messaging!, { vapidKey });

    if (token) {
      logger.info('FCM 토큰 생성 성공');
      logger.debug('FCM 토큰:', token.substring(0, 50) + '...');

      // 토큰을 로컬에만 저장 (서버 등록은 로그인 시에)
      localStorage.setItem('fcm_token_local', token);

      return token;
    } else {
      logger.warn('FCM 토큰 생성 실패 또는 권한이 거부되었습니다.');
      return null;
    }
  } catch (error) {
    logger.error('FCM 토큰 요청 중 오류:', error);
    return null;
  }
};

// FCM 토큰을 서버에 등록하는 함수
export const registerTokenToServer = async (
  token: string,
): Promise<boolean> => {
  try {
    // 동적 import로 notification API 가져오기 (순환 참조 방지)
    const { notificationApi } = await import('./api/notification');

    // 디바이스 정보 수집
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData?.platform || 'unknown',
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      userAgentData: navigator.userAgentData
        ? {
            mobile: navigator.userAgentData.mobile,
            brands: navigator.userAgentData.brands
              ?.map((brand) => brand.brand)
              .join(', '),
          }
        : null,
    };

    logger.debug('FCM 토큰 서버 등록 시작...');

    const response = await notificationApi.registerToken({
      token,
      device_type: 'web',
      device_info: deviceInfo,
    });

    if (response.success && response.data) {
      const tokenData = response.data as { id: string } & typeof response.data;
      logger.info('FCM 토큰 서버 등록 성공');
      logger.debug('토큰 ID:', tokenData.id);

      // 등록된 토큰 ID를 로컬 스토리지에 저장 (추후 토큰 관리용)
      localStorage.setItem('fcm_token_id', tokenData.id);
      localStorage.setItem('fcm_token', token);

      return true;
    } else {
      logger.error('FCM 토큰 서버 등록 실패:', response.message);
      return false;
    }
  } catch (error) {
    logger.error('FCM 토큰 서버 등록 중 오류:', error);

    // 네트워크 오류나 인증 오류인 경우에도 토큰은 로컬에 저장
    // (나중에 재시도할 수 있도록)
    localStorage.setItem('fcm_token_pending', token);

    return false;
  }
};

// 포그라운드 메시지 수신 리스너 설정
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject('FCM이 지원되지 않는 환경입니다.');
  }

  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      logger.info('포그라운드 메시지 수신:', payload);
      resolve(payload);
    });
  });
};

// 대기 중인 토큰 재시도 함수
export const retryPendingTokenRegistration = async (): Promise<boolean> => {
  const pendingToken = localStorage.getItem('fcm_token_pending');
  if (!pendingToken) {
    return false;
  }

  logger.debug('대기 중인 FCM 토큰 등록 재시도...');

  const success = await registerTokenToServer(pendingToken);
  if (success) {
    // 성공하면 대기 중인 토큰 삭제
    localStorage.removeItem('fcm_token_pending');
    logger.info('대기 중인 FCM 토큰 등록 성공');
  }

  return success;
};

// 로그인 시 FCM 토큰 서버 등록
export const registerFCMTokenOnLogin = async (): Promise<boolean> => {
  const localToken = localStorage.getItem('fcm_token_local');

  if (!localToken) {
    logger.debug('로컬 FCM 토큰이 없어 새로 생성합니다.');
    const newToken = await requestFCMToken();
    if (!newToken) {
      logger.warn('FCM 토큰 생성에 실패했습니다.');
      return false;
    }
    return await registerTokenToServer(newToken);
  }

  // 기존 토큰으로 서버 등록 시도
  return await registerTokenToServer(localToken);
};

// 로그아웃 시 FCM 토큰 비활성화
export const deactivateFCMTokenOnLogout = async (): Promise<boolean> => {
  const tokenId = localStorage.getItem('fcm_token_id');

  if (!tokenId) {
    logger.info('등록된 FCM 토큰이 없습니다.');
    return true;
  }

  try {
    const { notificationApi } = await import('./api/notification');

    logger.debug('FCM 토큰 비활성화 시작...');
    await notificationApi.deleteToken(tokenId);

    // 로컬 저장소에서 서버 관련 정보만 제거 (로컬 토큰은 유지)
    localStorage.removeItem('fcm_token_id');
    localStorage.removeItem('fcm_token');

    logger.info('FCM 토큰 비활성화 완료');
    return true;
  } catch (error) {
    logger.error('FCM 토큰 비활성화 중 오류:', error);
    return false;
  }
};

// 토큰 갱신 감지 및 자동 업데이트 (로그인된 사용자만)
export const setupTokenRefreshListener = () => {
  if (!messaging) {
    logger.warn(
      'Messaging이 초기화되지 않아 토큰 갱신 리스너를 설정할 수 없습니다.',
    );
    return;
  }

  // Firebase에서 토큰이 갱신될 때 자동으로 서버에 등록 (로그인된 경우만)
  getToken(messaging)
    .then((currentToken: string | null) => {
      if (currentToken) {
        const storedToken = localStorage.getItem('fcm_token');
        const isLoggedIn = localStorage.getItem('fcm_token_id'); // 서버 등록 여부로 로그인 상태 확인

        if (storedToken !== currentToken && isLoggedIn) {
          logger.debug('FCM 토큰이 갱신되어 서버에 재등록합니다.');
          registerTokenToServer(currentToken);
        } else if (storedToken !== currentToken) {
          // 로그인하지 않은 상태에서는 로컬에만 저장
          localStorage.setItem('fcm_token_local', currentToken);
        }
      }
    })
    .catch((error) => {
      logger.error('토큰 갱신 확인 중 오류:', error);
    });
};

// Firebase 앱 및 messaging 인스턴스 export
export { app, messaging };
export default app;
