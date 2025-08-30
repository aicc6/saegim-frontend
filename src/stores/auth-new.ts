import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { User } from '@/types';
import { TIMEOUTS } from '@/constants/timeouts';
import {
  AuthService,
  CrossTabService,
  SessionData,
} from '@/services/auth-service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  lastActivity: number;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearStorage: () => void;
  updateActivity: () => void;
  checkSessionExpiry: () => boolean;
}

const createInitialState = (): AuthState => ({
  user: null,
  isAuthenticated: false,
  sessionExpiry: null,
  lastActivity: Date.now(),
});

export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...createInitialState(),

        login: (user: User) => {
          const sessionData = AuthService.createSession(user);
          set({
            user: sessionData.user,
            isAuthenticated: sessionData.isAuthenticated,
            sessionExpiry: sessionData.sessionExpiry,
            lastActivity: sessionData.lastActivity,
          });

          CrossTabService.broadcastLogin(user, sessionData.lastActivity);
        },

        logout: () => {
          const clearedSession = AuthService.clearSession();
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            lastActivity: clearedSession.lastActivity,
          });

          CrossTabService.broadcastLogout();
        },

        updateUser: (userData: Partial<User>) => {
          const currentState = get();
          if (!currentState.user) return;

          const currentSessionData: SessionData = {
            user: currentState.user,
            isAuthenticated: currentState.isAuthenticated,
            sessionExpiry: currentState.sessionExpiry || 0,
            lastActivity: currentState.lastActivity,
          };

          const updatedSession = AuthService.updateUser(
            currentSessionData,
            userData,
          );

          set({
            user: updatedSession.user,
            lastActivity: updatedSession.lastActivity,
          });

          CrossTabService.broadcastUserUpdate(updatedSession.user);
        },

        updateActivity: () => {
          const currentState = get();
          if (!currentState.isAuthenticated) return;

          const currentSessionData: SessionData = {
            user: currentState.user!,
            isAuthenticated: currentState.isAuthenticated,
            sessionExpiry: currentState.sessionExpiry || 0,
            lastActivity: currentState.lastActivity,
          };

          const updatedSession = AuthService.updateActivity(currentSessionData);

          set({
            lastActivity: updatedSession.lastActivity,
            sessionExpiry: updatedSession.sessionExpiry,
          });
        },

        checkSessionExpiry: () => {
          const currentState = get();

          const currentSessionData: SessionData = {
            user: currentState.user!,
            isAuthenticated: currentState.isAuthenticated,
            sessionExpiry: currentState.sessionExpiry || 0,
            lastActivity: currentState.lastActivity,
          };

          const { isExpired, clearedSession } =
            AuthService.checkSessionExpiry(currentSessionData);

          if (isExpired && clearedSession) {
            set({
              user: null,
              isAuthenticated: false,
              sessionExpiry: null,
              lastActivity: clearedSession.lastActivity,
            });

            CrossTabService.broadcastExpired();
          }

          return isExpired;
        },

        clearStorage: () => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth-storage');

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

          const clearedSession = AuthService.clearSession();
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            lastActivity: clearedSession.lastActivity,
          });
        },
      }),
      {
        name: 'auth-storage',
        storage: {
          getItem: (name: string) => {
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: (name: string, value: unknown) => {
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name: string) => {
            sessionStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sessionExpiry: state.sessionExpiry,
          lastActivity: state.lastActivity,
        }),
        onRehydrateStorage: () => (state) => {
          if (state && state.sessionExpiry) {
            const now = Date.now();
            if (now > state.sessionExpiry) {
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

// Cross-tab 동기화 및 활동 추적 설정
let cleanupFunctions: (() => void)[] = [];

if (typeof window !== 'undefined') {
  const crossTabCleanup = CrossTabService.setupEventListeners({
    onLogin: (user, timestamp) => {
      useAuthStore.setState({
        user,
        isAuthenticated: true,
        sessionExpiry: timestamp + TIMEOUTS.SESSION_EXPIRE,
        lastActivity: timestamp,
      });
    },
    onLogout: () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        sessionExpiry: null,
        lastActivity: Date.now(),
      });
    },
    onUpdate: (user) => {
      useAuthStore.setState({
        user,
        lastActivity: Date.now(),
      });
    },
    onExpired: () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        sessionExpiry: null,
        lastActivity: Date.now(),
      });
    },
  });

  const activityHandler = () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated && !state.checkSessionExpiry()) {
      state.updateActivity();
    }
  };

  const activityCleanup =
    CrossTabService.setupActivityTracking(activityHandler);

  const sessionCheckInterval = setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      state.checkSessionExpiry();
    }
  }, TIMEOUTS.ACTIVITY_CHECK);

  cleanupFunctions = [
    crossTabCleanup,
    activityCleanup,
    () => clearInterval(sessionCheckInterval),
  ];
}

export const cleanupAuthStore = () => {
  cleanupFunctions.forEach((cleanup) => cleanup());
  cleanupFunctions = [];
};
