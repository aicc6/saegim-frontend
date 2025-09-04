import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { User } from '@/types';
import { TIMEOUTS } from '@/constants/timeouts';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  lastActivity: number;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearStorage: () => void;
  updateActivity: () => void;
  checkSessionExpiry: () => boolean;
}

// 세션 만료 시간 설정
const SESSION_TIMEOUT = TIMEOUTS.SESSION_EXPIRE;

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        sessionExpiry: null,
        lastActivity: Date.now(),

        login: (user: User) => {
          const now = Date.now();

          // localStorage에서 프로필 이미지 복원 (우선순위: localStorage > 백업들 > 서버 데이터)
          if (typeof window !== 'undefined') {
            try {
              // 여러 저장소에서 확인
              const storageKeys = [
                'saegim-profile-image',
                'saegim-profile-image-backup',
                'saegim-user-profile-image',
                'user-profile-image-saegim',
              ];

              let foundImage = null;
              for (const key of storageKeys) {
                const savedImage = localStorage.getItem(key);
                if (savedImage) {
                  foundImage = savedImage;
                  console.log(
                    `로그인 시 ${key}에서 프로필 이미지 복원됨:`,
                    savedImage,
                  );
                  break;
                }
              }

              if (foundImage) {
                user.profileImage = foundImage;
                // 메인 저장소로 복원
                localStorage.setItem('saegim-profile-image', foundImage);
              } else {
                console.log(
                  '저장된 프로필 이미지 없음, 서버 데이터 사용:',
                  user.profileImage,
                );
              }
            } catch (error) {
              console.warn('프로필 이미지 복원 실패:', error);
            }
          }

          set({
            user,
            isAuthenticated: true,
            sessionExpiry: now + SESSION_TIMEOUT,
            lastActivity: now,
          });

          // Cross-tab 로그인 상태 동기화
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth-login', {
                detail: { user, timestamp: now },
              }),
            );
          }
        },

        logout: () => {
          // 로그아웃 전에 현재 프로필 이미지를 localStorage에 보존
          const currentUser = get().user;
          if (currentUser?.profileImage && typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                'saegim-profile-image',
                currentUser.profileImage,
              );
              console.log(
                '로그아웃 시 프로필 이미지 보존됨:',
                currentUser.profileImage,
              );
            } catch (error) {
              console.warn('로그아웃 시 프로필 이미지 보존 실패:', error);
            }
          }

          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            lastActivity: Date.now(),
          });

          // Cross-tab 로그아웃 상태 동기화
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-logout'));
          }
        },

        updateUser: (userData: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            set({
              user: updatedUser,
              isAuthenticated: true, // 인증 상태 유지
              lastActivity: Date.now(),
            });

            // Cross-tab 사용자 정보 업데이트 동기화
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('auth-update', {
                  detail: { user: updatedUser },
                }),
              );
            }
          }
        },

        updateActivity: () => {
          const state = get();
          if (state.isAuthenticated) {
            const now = Date.now();
            // 마지막 활동 시간과 1초 이상 차이가 날 때만 업데이트 (중복 호출 방지)
            if (now - state.lastActivity > 1000) {
              set({
                lastActivity: now,
                sessionExpiry: now + SESSION_TIMEOUT,
              });
            }
          }
        },

        checkSessionExpiry: () => {
          const state = get();
          if (!state.isAuthenticated || !state.sessionExpiry) {
            return true; // 로그인하지 않았거나 세션 정보가 없으면 만료된 것으로 간주
          }

          const now = Date.now();
          const isExpired = now > state.sessionExpiry;

          if (isExpired) {
            // 세션 만료 시 자동 로그아웃
            set({
              user: null,
              isAuthenticated: false,
              sessionExpiry: null,
              lastActivity: now,
            });

            // Cross-tab 동기화
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth-expired'));
            }
          }

          return isExpired;
        },

        clearStorage: () => {
          // 로컬 스토리지에서 인증 정보 완전 삭제
          if (typeof window !== 'undefined') {
            // auth-storage만 삭제 (다른 앱의 데이터 보호)
            localStorage.removeItem('auth-storage');

            // 모든 localStorage 항목 삭제 (auth 관련) - 프로필 이미지는 제외
            const protectedKeys = [
              'saegim-profile-image',
              'saegim-profile-image-backup',
              'saegim-user-profile-image',
              'user-profile-image-saegim',
            ];

            Object.keys(localStorage).forEach((key) => {
              if (
                key.includes('auth') ||
                key.includes('user') ||
                key.includes('token')
              ) {
                // 프로필 이미지 관련 키들은 삭제하지 않음
                if (!protectedKeys.includes(key)) {
                  localStorage.removeItem(key);
                }
              }
            });

            // 프로필 이미지 유지 확인 로그
            const savedImage = localStorage.getItem('saegim-profile-image');
            const backupImage = localStorage.getItem(
              'saegim-profile-image-backup',
            );
            if (savedImage) {
              console.log('로그아웃 후 프로필 이미지 유지됨:', savedImage);
            }
            if (backupImage) {
              console.log(
                '로그아웃 후 프로필 이미지 백업 유지됨:',
                backupImage,
              );
            }
          }
          // Zustand 스토어도 초기화
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            lastActivity: Date.now(),
          });
        },
      }),
      {
        name: 'auth-storage',
        storage: {
          getItem: (name: string) => {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name: string, value: unknown) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name: string) => {
            localStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sessionExpiry: state.sessionExpiry,
          lastActivity: state.lastActivity,
        }),
        // 세션 복원 시 만료 검사
        onRehydrateStorage: () => (state) => {
          if (state && state.sessionExpiry) {
            const now = Date.now();
            if (now > state.sessionExpiry) {
              // 만료된 세션이면 초기화
              state.user = null;
              state.isAuthenticated = false;
              state.sessionExpiry = null;
              state.lastActivity = now;
            }
          }
        },
      },
    ),
  ),
);

// Cross-tab 동기화 및 세션 관리 설정
let cleanupFunctions: (() => void)[] = [];

if (typeof window !== 'undefined') {
  // 로그인 동기화 핸들러
  const handleAuthLogin = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { user, timestamp } = customEvent.detail;
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      sessionExpiry: timestamp + SESSION_TIMEOUT,
      lastActivity: timestamp,
    });
  };

  // 로그아웃 동기화 핸들러
  const handleAuthLogout = () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionExpiry: null,
      lastActivity: Date.now(),
    });
  };

  // 사용자 정보 업데이트 동기화 핸들러
  const handleAuthUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { user } = customEvent.detail;
    useAuthStore.setState({
      user,
      lastActivity: Date.now(),
    });
  };

  // 세션 만료 동기화 핸들러
  const handleAuthExpired = () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionExpiry: null,
      lastActivity: Date.now(),
    });
  };

  // 이벤트 리스너 등록
  window.addEventListener('auth-login', handleAuthLogin);
  window.addEventListener('auth-logout', handleAuthLogout);
  window.addEventListener('auth-update', handleAuthUpdate);
  window.addEventListener('auth-expired', handleAuthExpired);

  // 활동 추적 핸들러 (디바운싱 적용)
  let activityTimeout: NodeJS.Timeout | null = null;
  const activityHandler = () => {
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }

    activityTimeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && !state.checkSessionExpiry()) {
        state.updateActivity();
      }
    }, 100); // 100ms 디바운싱
  };

  // 사용자 활동 추적을 위한 이벤트 리스너
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  activityEvents.forEach((event) => {
    window.addEventListener(event, activityHandler, { passive: true });
  });

  // 주기적인 세션 만료 검사
  const sessionCheckInterval = setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      state.checkSessionExpiry();
    }
  }, TIMEOUTS.ACTIVITY_CHECK);

  // Cleanup 함수들 등록
  cleanupFunctions = [
    () => window.removeEventListener('auth-login', handleAuthLogin),
    () => window.removeEventListener('auth-logout', handleAuthLogout),
    () => window.removeEventListener('auth-update', handleAuthUpdate),
    () => window.removeEventListener('auth-expired', handleAuthExpired),
    ...activityEvents.map(
      (event) => () => window.removeEventListener(event, activityHandler),
    ),
    () => clearInterval(sessionCheckInterval),
    () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    },
  ];
}

// 전역 cleanup 함수 (필요시 호출)
export const cleanupAuthStore = () => {
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];
};
