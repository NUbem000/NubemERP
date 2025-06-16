import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Create Redis client for rate limiting
const redisClient = createClient({
  url: config.redis.url,
  ...config.redis.options
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected for rate limiting');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

// Create rate limiter with Redis store
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: req.rateLimit.resetTime
      });
    },
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs
      const whitelistedIPs = ['127.0.0.1', '::1'];
      return whitelistedIPs.includes(req.ip);
    }
  };

  // Use Redis store if available
  if (redisClient.isOpen) {
    defaultOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    });
  }

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter();

// Strict rate limiter for auth endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true
});

// Moderate rate limiter for create operations
export const createLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100 // 100 creates per hour
});

// File upload rate limiter
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20 // 20 uploads per hour
});

// Dynamic rate limiter based on user plan
export const dynamicRateLimiter = (req, res, next) => {
  const limits = {
    free: 100,
    starter: 500,
    professional: 1000,
    enterprise: 5000
  };

  const userPlan = req.user?.subscription?.plan || 'free';
  const limit = limits[userPlan] || limits.free;

  const limiter = createRateLimiter({
    max: limit,
    keyGenerator: (req) => req.user?._id || req.ip
  });

  return limiter(req, res, next);
};

// IP-based rate limiter
export const ipRateLimiter = createRateLimiter({
  keyGenerator: (req) => req.ip,
  max: 1000, // 1000 requests per window per IP
  windowMs: 15 * 60 * 1000 // 15 minutes
});

// Endpoint-specific rate limiters
export const endpointLimiters = {
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  }),
  
  register: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3
  }),
  
  forgotPassword: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3
  }),
  
  resendVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3
  }),
  
  apiKey: createRateLimiter({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5
  })
};

// Distributed rate limiter for microservices
export class DistributedRateLimiter {
  constructor(options) {
    this.options = options;
    this.prefix = options.prefix || 'drl:';
  }

  async isAllowed(key, limit = 100, window = 60000) {
    const now = Date.now();
    const windowStart = now - window;
    const redisKey = `${this.prefix}${key}`;

    try {
      // Remove old entries
      await redisClient.zRemRangeByScore(redisKey, '-inf', windowStart);
      
      // Count requests in current window
      const count = await redisClient.zCard(redisKey);
      
      if (count < limit) {
        // Add current request
        await redisClient.zAdd(redisKey, {
          score: now,
          value: `${now}-${Math.random()}`
        });
        
        // Set expiry
        await redisClient.expire(redisKey, Math.ceil(window / 1000));
        
        return {
          allowed: true,
          remaining: limit - count - 1,
          resetTime: new Date(now + window)
        };
      } else {
        // Get oldest entry to determine reset time
        const oldest = await redisClient.zRange(redisKey, 0, 0, {
          withScores: true
        });
        
        const resetTime = oldest[0] ? new Date(oldest[0].score + window) : new Date(now + window);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }
    } catch (error) {
      logger.error('Distributed rate limiter error:', error);
      // Fail open in case of Redis errors
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(now + window)
      };
    }
  }

  middleware(limit = 100, window = 60000) {
    return async (req, res, next) => {
      const key = req.user?._id || req.ip;
      const result = await this.isAllowed(key, limit, window);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.resetTime
        });
      }

      next();
    };
  }
}

// Export distributed rate limiter instance
export const distributedLimiter = new DistributedRateLimiter({
  prefix: 'holded:rl:'
});

// Cleanup on shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
});