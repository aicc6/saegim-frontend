export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5,
}

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
    if (process.env.NODE_ENV === 'production') {
      return LogLevel.WARN;
    }
    return LogLevel.DEBUG;
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

const loggers = new Map<string, Logger>();

export function getLogger(name: string = 'default'): Logger {
  if (!loggers.has(name)) {
    loggers.set(name, new Logger(name));
  }
  return loggers.get(name)!;
}

export const logger = getLogger();

export default logger;
