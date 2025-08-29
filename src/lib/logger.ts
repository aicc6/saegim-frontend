export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

// 글로벌 로그 설정
interface GlobalLogConfig {
  defaultLevel: LogLevel;
  moduleOverrides: Record<string, LogLevel>;
  enablePersistence: boolean;
}

const STORAGE_KEY = 'saegim-logger-config';

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  enableColors: boolean;
  enableTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private name: string;

  constructor(name: string = 'default', config?: Partial<LoggerConfig>) {
    this.name = name;
    this.config = {
      level: this.getDefaultLevel(),
      prefix: name,
      enableColors: process.env.NODE_ENV === 'development',
      enableTimestamp: true,
      ...config,
    };
  }

  private getDefaultLevel(): LogLevel {
    // 환경변수에서 로그 레벨 확인
    const envLevel = this.getEnvLogLevel();
    if (envLevel !== null) {
      return envLevel;
    }

    // 모듈별 로그 레벨 오버라이드 확인
    const moduleLevel = globalConfig.moduleOverrides[this.name];
    if (moduleLevel !== undefined) {
      return moduleLevel;
    }

    // 글로벌 기본 레벨
    return globalConfig.defaultLevel;
  }

  private getEnvLogLevel(): LogLevel | null {
    try {
      const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
      if (!envLevel) return null;

      const upperLevel = envLevel.toUpperCase();
      if (upperLevel in LogLevel) {
        return LogLevel[upperLevel as keyof typeof LogLevel];
      }
    } catch {
      // 환경변수 접근 실패 시 null 반환
    }
    return null;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: string, ...args: unknown[]): unknown[] {
    const timestamp = this.config.enableTimestamp
      ? `[${new Date().toISOString().slice(11, 23)}]`
      : '';

    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';

    if (this.config.enableColors) {
      const colorMap = {
        TRACE: '\x1b[90m', // gray
        DEBUG: '\x1b[36m', // cyan
        INFO: '\x1b[32m', // green
        WARN: '\x1b[33m', // yellow
        ERROR: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      const color = colorMap[level as keyof typeof colorMap] || '';

      return [`${color}${timestamp}${prefix}[${level}]${reset}`, ...args];
    }

    return [`${timestamp}${prefix}[${level}]`, ...args];
  }

  trace(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    console.log(...this.formatMessage('TRACE', ...args));
  }

  debug(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(...this.formatMessage('DEBUG', ...args));
  }

  info(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(...this.formatMessage('INFO', ...args));
  }

  warn(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(...this.formatMessage('WARN', ...args));
  }

  error(...args: unknown[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    console.error(...this.formatMessage('ERROR', ...args));
  }

  setLevel(level: LogLevel | keyof typeof LogLevel): void {
    if (typeof level === 'string') {
      this.config.level = LogLevel[level as keyof typeof LogLevel];
    } else {
      this.config.level = level;
    }
  }

  getLevel(): LogLevel {
    return this.config.level;
  }
}

// 글로벌 설정 초기화
function initializeGlobalConfig(): GlobalLogConfig {
  const defaultConfig: GlobalLogConfig = {
    defaultLevel:
      typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? LogLevel.WARN
        : LogLevel.DEBUG,
    moduleOverrides: {},
    enablePersistence: true,
  };

  // 로컬스토리지에서 설정 로드
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        return { ...defaultConfig, ...parsedConfig };
      }
    } catch {
      // 파싱 실패시 기본 설정 사용
    }
  }

  return defaultConfig;
}

// 설정 저장
function saveGlobalConfig(): void {
  if (typeof window !== 'undefined' && globalConfig.enablePersistence) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalConfig));
    } catch {
      // 저장 실패시 무시
    }
  }
}

const globalConfig = initializeGlobalConfig();
const loggers = new Map<string, Logger>();

export function getLogger(name: string = 'default'): Logger {
  if (!loggers.has(name)) {
    loggers.set(name, new Logger(name));
  }
  return loggers.get(name)!;
}

// 글로벌 로깅 설정 관리 함수들
export function setGlobalLogLevel(
  level: LogLevel | keyof typeof LogLevel,
): void {
  const normalizedLevel = typeof level === 'string' ? LogLevel[level] : level;
  globalConfig.defaultLevel = normalizedLevel;

  // 모든 기존 로거들 재설정
  loggers.forEach((logger, name) => {
    // 모듈별 오버라이드가 없는 경우만 업데이트
    if (!(name in globalConfig.moduleOverrides)) {
      logger.setLevel(normalizedLevel);
    }
  });

  saveGlobalConfig();
}

export function setModuleLogLevel(
  moduleName: string,
  level: LogLevel | keyof typeof LogLevel,
): void {
  const normalizedLevel = typeof level === 'string' ? LogLevel[level] : level;
  globalConfig.moduleOverrides[moduleName] = normalizedLevel;

  // 해당 모듈 로거가 존재하면 업데이트
  const existingLogger = loggers.get(moduleName);
  if (existingLogger) {
    existingLogger.setLevel(normalizedLevel);
  }

  saveGlobalConfig();
}

export function removeModuleLogLevel(moduleName: string): void {
  delete globalConfig.moduleOverrides[moduleName];

  // 해당 모듈 로거를 기본 레벨로 리셋
  const existingLogger = loggers.get(moduleName);
  if (existingLogger) {
    existingLogger.setLevel(globalConfig.defaultLevel);
  }

  saveGlobalConfig();
}

export function getAllLoggers(): Record<
  string,
  { name: string; level: string; levelValue: number }
> {
  const result: Record<
    string,
    { name: string; level: string; levelValue: number }
  > = {};

  loggers.forEach((logger, name) => {
    const level = logger.getLevel();
    result[name] = {
      name,
      level: LOG_LEVEL_NAMES[level],
      levelValue: level,
    };
  });

  return result;
}

export function getLoggingConfig(): GlobalLogConfig & { totalLoggers: number } {
  return {
    ...globalConfig,
    totalLoggers: loggers.size,
  };
}

export function resetAllLoggers(): void {
  globalConfig.moduleOverrides = {};

  loggers.forEach((logger) => {
    logger.setLevel(globalConfig.defaultLevel);
  });

  saveGlobalConfig();
}

// 브라우저 개발자 도구용 헬퍼 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as Window & { __SAEGIM_LOGGER__?: unknown }).__SAEGIM_LOGGER__ = {
    setGlobalLevel: setGlobalLogLevel,
    setModuleLevel: setModuleLogLevel,
    getAllLoggers,
    getConfig: getLoggingConfig,
    resetAll: resetAllLoggers,
    LogLevel,
  };
}

export const logger = getLogger();

export default logger;
