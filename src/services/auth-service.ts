'use client';

import { User } from '@/types';
import { TIMEOUTS } from '@/constants/timeouts';
import { getLogger } from '@/lib/logger';

const logger = getLogger('auth-service');

export interface SessionData {
  user: User;
  isAuthenticated: boolean;
  sessionExpiry: number;
  lastActivity: number;
}

export class AuthService {
  private static readonly SESSION_TIMEOUT = TIMEOUTS.SESSION_EXPIRE;

  static createSession(user: User): SessionData {
    const now = Date.now();
    const sessionData = {
      user,
      isAuthenticated: true,
      sessionExpiry: now + this.SESSION_TIMEOUT,
      lastActivity: now,
    };

    logger.info('새 세션 생성', {
      userId: user.id,
      expiry: sessionData.sessionExpiry,
    });
    return sessionData;
  }

  static updateActivity(sessionData: SessionData): SessionData {
    if (!sessionData.isAuthenticated) return sessionData;

    const now = Date.now();
    const updatedSession = {
      ...sessionData,
      lastActivity: now,
      sessionExpiry: now + this.SESSION_TIMEOUT,
    };

    logger.debug('사용자 활동 업데이트', {
      lastActivity: updatedSession.lastActivity,
      newExpiry: updatedSession.sessionExpiry,
    });

    return updatedSession;
  }

  static checkSessionExpiry(sessionData: SessionData): {
    isExpired: boolean;
    clearedSession?: SessionData;
  } {
    if (!sessionData.isAuthenticated || !sessionData.sessionExpiry) {
      return { isExpired: true };
    }

    const now = Date.now();
    const isExpired = now > sessionData.sessionExpiry;

    if (isExpired) {
      const clearedSession: SessionData = {
        user: sessionData.user,
        isAuthenticated: false,
        sessionExpiry: 0,
        lastActivity: now,
      };

      logger.warn('세션 만료됨', {
        userId: sessionData.user.id,
        expiredTime: sessionData.sessionExpiry,
        currentTime: now,
      });

      return { isExpired: true, clearedSession };
    }

    return { isExpired: false };
  }

  static updateUser(
    sessionData: SessionData,
    userData: Partial<User>,
  ): SessionData {
    if (!sessionData.user) return sessionData;

    const updatedUser = { ...sessionData.user, ...userData };
    const updatedSession = {
      ...sessionData,
      user: updatedUser,
      lastActivity: Date.now(),
    };

    logger.info('사용자 정보 업데이트', {
      userId: updatedUser.id,
      updatedFields: Object.keys(userData),
    });

    return updatedSession;
  }

  static clearSession(): SessionData {
    const now = Date.now();
    const clearedSession: SessionData = {
      user: {} as User,
      isAuthenticated: false,
      sessionExpiry: 0,
      lastActivity: now,
    };

    logger.info('세션 초기화됨', { timestamp: now });
    return clearedSession;
  }
}

export class CrossTabService {
  private static readonly AUTH_EVENTS = {
    LOGIN: 'auth-login',
    LOGOUT: 'auth-logout',
    UPDATE: 'auth-update',
    EXPIRED: 'auth-expired',
  } as const;

  static broadcastLogin(user: User, timestamp: number): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent(this.AUTH_EVENTS.LOGIN, {
        detail: { user, timestamp },
      }),
    );

    logger.debug('로그인 이벤트 브로드캐스트', { userId: user.id });
  }

  static broadcastLogout(): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent(this.AUTH_EVENTS.LOGOUT));
    logger.debug('로그아웃 이벤트 브로드캐스트');
  }

  static broadcastUserUpdate(user: User): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent(this.AUTH_EVENTS.UPDATE, {
        detail: { user },
      }),
    );

    logger.debug('사용자 업데이트 이벤트 브로드캐스트', { userId: user.id });
  }

  static broadcastExpired(): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent(this.AUTH_EVENTS.EXPIRED));
    logger.debug('세션 만료 이벤트 브로드캐스트');
  }

  static setupEventListeners(callbacks: {
    onLogin: (user: User, timestamp: number) => void;
    onLogout: () => void;
    onUpdate: (user: User) => void;
    onExpired: () => void;
  }): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleLogin = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { user, timestamp } = customEvent.detail;
      callbacks.onLogin(user, timestamp);
    };

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { user } = customEvent.detail;
      callbacks.onUpdate(user);
    };

    window.addEventListener(this.AUTH_EVENTS.LOGIN, handleLogin);
    window.addEventListener(this.AUTH_EVENTS.LOGOUT, callbacks.onLogout);
    window.addEventListener(this.AUTH_EVENTS.UPDATE, handleUpdate);
    window.addEventListener(this.AUTH_EVENTS.EXPIRED, callbacks.onExpired);

    return () => {
      window.removeEventListener(this.AUTH_EVENTS.LOGIN, handleLogin);
      window.removeEventListener(this.AUTH_EVENTS.LOGOUT, callbacks.onLogout);
      window.removeEventListener(this.AUTH_EVENTS.UPDATE, handleUpdate);
      window.removeEventListener(this.AUTH_EVENTS.EXPIRED, callbacks.onExpired);
    };
  }

  static setupActivityTracking(activityHandler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

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

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }
}
