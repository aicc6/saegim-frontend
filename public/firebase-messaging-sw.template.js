/* eslint-env serviceworker */
/* global firebase, importScripts, clients */

// Firebase Messaging Service Worker for background notifications
// Service Worker 환경에서는 ES6 모듈을 사용할 수 없으므로 importScripts 사용
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js',
);

// Firebase 설정 (빌드 시점에 환경변수가 주입됨)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 초기화 (Service Worker 환경에서는 firebase 전역 객체 사용)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);

  // Firebase Messaging 인스턴스 생성
  const messaging = firebase.messaging();

  // 백그라운드 메시지 수신 처리
  messaging.onBackgroundMessage((payload) => {
    console.log('백그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification?.title || '새김 알림';
    const notificationOptions = {
      body: payload.notification?.body || '새로운 알림이 도착했습니다.',
      icon: '/images/logo.webp', // 새김 로고
      badge: '/images/logo.webp',
      tag: payload.data?.type || 'general',
      data: {
        ...payload.data,
        url: payload.data?.url || '/', // 클릭 시 이동할 URL
      },
      requireInteraction: true, // 사용자가 직접 닫을 때까지 표시
      actions: [
        {
          action: 'open',
          title: '열기',
          icon: '/images/logo.webp',
        },
        {
          action: 'close',
          title: '닫기',
        },
      ],
    };

    // 새김 특화: 감정별 알림 아이콘 설정
    if (payload.data?.emotion) {
      const emotionIcons = {
        happy: '/images/emotions/happy.png',
        sad: '/images/emotions/sad.png',
        angry: '/images/emotions/angry.png',
        peaceful: '/images/emotions/peaceful.png',
        unrest: '/images/emotions/unrest.png',
      };

      notificationOptions.icon =
        emotionIcons[payload.data.emotion] || notificationOptions.icon;
    }

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error('Firebase SDK가 로드되지 않았습니다.');
}

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 클릭 시 새김 앱으로 이동
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 새김 탭이 있는지 확인
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }

        // 열린 탭이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// 알림이 닫힐 때 이벤트 처리 (분석용)
self.addEventListener('notificationclose', (event) => {
  console.log('알림 닫힘:', event.notification.tag);

  // TODO: 알림 닫힘 이벤트를 분석 서버로 전송
  // 사용자의 알림 패턴 분석을 위한 데이터 수집
});

// Service Worker 설치 이벤트
self.addEventListener('install', (_event) => {
  console.log('새김 FCM Service Worker 설치됨');
  self.skipWaiting();
});

// Service Worker 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('새김 FCM Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});
