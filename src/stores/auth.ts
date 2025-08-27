import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      clearStorage: () => {
        // 로컬 스토리지에서 인증 정보 완전 삭제
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          sessionStorage.removeItem('auth-storage');
          
          // 모든 로컬 스토리지 항목 삭제 (auth 관련)
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth') || key.includes('user') || key.includes('token')) {
              localStorage.removeItem(key);
            }
          });
          
          // 모든 세션 스토리지 항목 삭제 (auth 관련)
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('auth') || key.includes('user') || key.includes('token')) {
              sessionStorage.removeItem(key);
            }
          });
        }
        // Zustand 스토어도 초기화
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
