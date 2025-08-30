import { StateCreator } from 'zustand';
import {
  persist,
  PersistOptions,
  subscribeWithSelector,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getLogger } from './logger';

const logger = getLogger('store-helpers');

// 공통 에러 상태 타입
export interface ErrorState {
  error: string | null;
  isLoading: boolean;
}

// 공통 에러 액션 타입
export interface ErrorActions {
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 표준화된 에러 처리 헬퍼
export const createErrorActions = <T extends ErrorState>(): {
  clearError: () => Partial<T>;
  setLoading: (loading: boolean) => Partial<T>;
  setError: (error: string | null) => Partial<T>;
} => ({
  clearError: () => ({ error: null }) as Partial<T>,
  setLoading: (loading: boolean) => ({ isLoading: loading }) as Partial<T>,
  setError: (error: string | null) =>
    ({ error, isLoading: false }) as Partial<T>,
});

// API 에러 처리 유틸리티
export const handleApiError = (error: unknown, context: string): string => {
  logger.error(`API 에러 - ${context}`, { error });

  if (error instanceof Error) {
    return error.message;
  }

  return `${context}에 실패했습니다.`;
};

// 비동기 액션 래퍼 (에러 처리 자동화)
export const createAsyncAction = <TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  context: string,
) => {
  return async (...args: TArgs): Promise<TResult | null> => {
    try {
      return await action(...args);
    } catch (error) {
      const errorMessage = handleApiError(error, context);
      throw new Error(errorMessage);
    }
  };
};

// 표준화된 persist 설정
export interface StandardPersistConfig<T> {
  name: string;
  partialize?: (state: T) => Partial<T>;
  storage?: 'localStorage' | 'sessionStorage';
  onRehydrateStorage?: (state: T | undefined) => void | Promise<void>;
}

// 표준화된 스토어 생성 헬퍼
export const createStandardStore = <T>(
  creator: StateCreator<T, [], [], T>,
  options?: {
    persist?: StandardPersistConfig<T>;
    enableImmer?: boolean;
    enableSelector?: boolean;
  },
) => {
  let wrappedCreator = creator;

  // immer 미들웨어 적용
  if (options?.enableImmer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrappedCreator = immer(creator as any) as any;
  }

  // subscribeWithSelector 미들웨어 적용
  if (options?.enableSelector) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrappedCreator = subscribeWithSelector(wrappedCreator as any) as any;
  }

  // persist 미들웨어 적용
  if (options?.persist) {
    const persistConfig: PersistOptions<T> = {
      name: options.persist.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialize: options.persist.partialize as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRehydrateStorage: options.persist.onRehydrateStorage as any,
    };

    // 스토리지 타입 설정
    if (options.persist.storage === 'sessionStorage') {
      persistConfig.storage = {
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
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrappedCreator = persist(wrappedCreator as any, persistConfig) as any;
  }

  return wrappedCreator;
};

// 표준화된 초기 에러 상태
export const createInitialErrorState = (): ErrorState => ({
  error: null,
  isLoading: false,
});

// 서비스 클래스용 에러 처리 래퍼
export const createServiceMethod = <TArgs extends unknown[], TResult>(
  method: (...args: TArgs) => Promise<TResult>,
  methodName: string,
  logger: ReturnType<typeof import('./logger').getLogger>,
  defaultErrorMessage?: string,
) => {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      const result = await method(...args);
      logger.info(
        `${methodName} 성공`,
        args.length > 0 ? { args: args[0] } : {},
      );
      return result;
    } catch (error) {
      logger.error(`${methodName} 실패`, {
        error,
        args: args.length > 0 ? args[0] : undefined,
      });
      throw new Error(
        error instanceof Error
          ? error.message
          : defaultErrorMessage || `${methodName}에 실패했습니다.`,
      );
    }
  };
};
