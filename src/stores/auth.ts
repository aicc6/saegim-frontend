import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { User } from '@/types';

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

// 보안을 위한 sessionStorage 사용 사용자 정의 저장소
const createSessionStorage = () => {
  return {
    getItem: (name: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const item = sessionStorage.getItem(name);
        if (!item) return null;
        // 데이터 무결성 검증을 위한 기본적인 검증
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === 'object') {
          return item;
        }
        return null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.setItem(name, value);
      } catch {
        // sessionStorage 공간 부족 또는 기타 오류 시 무시
        console.warn('sessionStorage 저장 실패');
      }
    },
    removeItem: (name: string) => {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(name);
    },
  };
};

// 세션 만료 시간 설정 (8시간)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8시간

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
            set({
              lastActivity: now,
              sessionExpiry: now + SESSION_TIMEOUT,
            });
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
          // 세션 스토리지에서 인증 정보 완전 삭제
          if (typeof window !== 'undefined') {
            // auth-storage만 삭제 (다른 앱의 데이터 보호)
            sessionStorage.removeItem('auth-storage');

            // 모든 sessionStorage 항목 삭제 (auth 관련)
            Object.keys(sessionStorage).forEach((key) => {
              if (
                key.includes('auth') ||
                key.includes('user') ||
                key.includes('token')
              ) {
                sessionStorage.removeItem(key);
              }
            });
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
        storage: createSessionStorage(), // sessionStorage 사용
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

// Cross-tab 동기화 설정
if (typeof window !== 'undefined') {
  // 다른 탭에서 로그인 시 동기화
  window.addEventListener('auth-login', (event) => {
    const customEvent = event as CustomEvent;
    const { user, timestamp } = customEvent.detail;
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      sessionExpiry: timestamp + SESSION_TIMEOUT,
      lastActivity: timestamp,
    });
  });

  // 다른 탭에서 로그아웃 시 동기화
  window.addEventListener('auth-logout', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionExpiry: null,
      lastActivity: Date.now(),
    });
  });

  // 다른 탭에서 사용자 정보 업데이트 시 동기화
  window.addEventListener('auth-update', (event) => {
    const customEvent = event as CustomEvent;
    const { user } = customEvent.detail;
    useAuthStore.setState({
      user,
      lastActivity: Date.now(),
    });
  });

  // 다른 탭에서 세션 만료 시 동기화
  window.addEventListener('auth-expired', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      sessionExpiry: null,
      lastActivity: Date.now(),
    });
  });

  // 주기적인 세션 만료 검사 (1분마다)
  setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      state.checkSessionExpiry();
    }
  }, 60 * 1000); // 1분

  // 사용자 활동 추적을 위한 이벤트 리스너
  [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ].forEach((event) => {
    window.addEventListener(
      event,
      () => {
        const state = useAuthStore.getState();
        if (state.isAuthenticated && !state.checkSessionExpiry()) {
          state.updateActivity();
        }
      },
      { passive: true },
    );
  });
}
