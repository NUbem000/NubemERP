import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/index.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Create transports array
const transports = [];

// Console transport
if (config.env !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      )
    })
  );
}

// File transports for production
if (config.isProduction) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );
  
  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.monitoring.logLevel || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { 
    service: 'holded-api',
    environment: config.env 
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  ]
});

// Create child loggers for specific modules
export const createLogger = (module) => {
  return logger.child({ module });
};

// Log levels
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Utility functions
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  });
};

export const logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id
  };
  
  if (res.statusCode >= 400) {
    logger.warn(logData);
  } else {
    logger.http(logData);
  }
};

export const logDatabaseQuery = (query, duration) => {
  logger.debug({
    type: 'database',
    query: query.cmd,
    collection: query.collection,
    duration: `${duration}ms`
  });
};

// Export for use in other modules
export default logger;