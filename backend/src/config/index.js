import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config();

// Schema validation for environment variables
const envSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'test', 'production').default('development'),
  PORT: joi.number().default(3000),
  
  // Database
  MONGODB_URI: joi.string().required().description('MongoDB connection string'),
  REDIS_URL: joi.string().default('redis://localhost:6379'),
  
  // Security
  JWT_SECRET: joi.string().required().min(32).description('JWT secret key'),
  JWT_EXPIRE: joi.string().default('7d'),
  BCRYPT_ROUNDS: joi.number().default(12),
  
  // CORS
  CORS_ORIGINS: joi.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: joi.number().default(100),
  
  // External APIs
  HOLDED_API_KEY: joi.string().description('Holded API key for integrations'),
  HOLDED_API_URL: joi.string().default('https://api.holded.com/api/'),
  
  // Email
  SMTP_HOST: joi.string().default('smtp.gmail.com'),
  SMTP_PORT: joi.number().default(587),
  SMTP_USER: joi.string(),
  SMTP_PASS: joi.string(),
  EMAIL_FROM: joi.string().default('noreply@holded-analysis.com'),
  
  // Storage
  UPLOAD_PATH: joi.string().default('./uploads'),
  MAX_FILE_SIZE: joi.number().default(10 * 1024 * 1024), // 10MB
  
  // Monitoring
  SENTRY_DSN: joi.string(),
  LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // Cache
  CACHE_TTL: joi.number().default(3600), // 1 hour
  
  // Pagination
  DEFAULT_PAGE_SIZE: joi.number().default(20),
  MAX_PAGE_SIZE: joi.number().default(100),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  
  database: {
    mongoUri: envVars.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }
  },
  
  redis: {
    url: envVars.REDIS_URL,
    options: {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    }
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRE,
  },
  
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    allowedOrigins: envVars.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  },
  
  cors: {
    origins: envVars.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW,
    max: envVars.RATE_LIMIT_MAX,
  },
  
  holded: {
    apiKey: envVars.HOLDED_API_KEY,
    apiUrl: envVars.HOLDED_API_URL,
  },
  
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: envVars.SMTP_PORT === 465,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  
  storage: {
    uploadPath: envVars.UPLOAD_PATH,
    maxFileSize: envVars.MAX_FILE_SIZE,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  monitoring: {
    sentryDsn: envVars.SENTRY_DSN,
    logLevel: envVars.LOG_LEVEL,
  },
  
  cache: {
    ttl: envVars.CACHE_TTL,
  },
  
  pagination: {
    defaultSize: envVars.DEFAULT_PAGE_SIZE,
    maxSize: envVars.MAX_PAGE_SIZE,
  },
  
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
};