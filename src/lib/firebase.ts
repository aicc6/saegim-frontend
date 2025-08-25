// Firebase 초기화 및 FCM 설정
import { initializeApp, getApps } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from 'firebase/messaging';

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
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      messagingInitialized = true;
      console.log('Firebase Messaging 초기화 완료');
    } else {
      console.warn('FCM이 지원되지 않는 브라우저입니다.');
    }
  }).catch((error) => {
    console.error('FCM 지원 확인 중 오류:', error);
  });
}

// FCM 토큰 요청 함수
export const requestFCMToken = async (): Promise<string | null> => {
  // messaging 인스턴스가 초기화될 때까지 대기
  if (!messagingInitialized) {
    console.log('FCM 초기화를 기다리는 중...');
    
    // 최대 5초간 초기화 대기
    for (let i = 0; i < 50; i++) {
      if (messagingInitialized && messaging) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!messagingInitialized || !messaging) {
      console.warn('FCM이 지원되지 않는 환경이거나 초기화에 실패했습니다.');
      return null;
    }
  }

  try {
    // VAPID 키는 환경변수에서 가져옴
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID 키가 설정되지 않았습니다.');
    }

    console.log('FCM 토큰 요청 시작...');
    const token = await getToken(messaging!, { vapidKey });

    if (token) {
      console.log('FCM 토큰 생성 성공:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.log('FCM 토큰 생성 실패 또는 권한이 거부되었습니다.');
      return null;
    }
  } catch (error) {
    console.error('FCM 토큰 요청 중 오류:', error);
    return null;
  }
};

// 포그라운드 메시지 수신 리스너 설정
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject('FCM이 지원되지 않는 환경입니다.');
  }

  return new Promise((resolve) => {
    onMessage(messaging!, (payload) => {
      console.log('포그라운드 메시지 수신:', payload);
      resolve(payload);
    });
  });
};

// Firebase 앱 및 messaging 인스턴스 export
export { app, messaging };
export default app;
