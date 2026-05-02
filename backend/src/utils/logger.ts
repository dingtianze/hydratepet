type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = process.env.LOG_LEVEL || 'info';

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel as LogLevel];
};

const formatMessage = (level: LogLevel, message: string | object): string => {
  const timestamp = new Date().toISOString();
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message, null, 2) 
    : message;
  return `[${timestamp}] [${level.toUpperCase()}]: ${formattedMessage}`;
};

export const logger = {
  debug: (message: string | object) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message));
    }
  },
  info: (message: string | object) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message));
    }
  },
  warn: (message: string | object) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message));
    }
  },
  error: (message: string | object, error?: Error) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message));
      if (error) {
        console.error(error.stack || error.message);
      }
    }
  },
};
