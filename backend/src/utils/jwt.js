import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './AppError.js';

// Generate token
export const generateToken = (payload, secret = config.jwt.secret, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'holded-analysis',
    audience: 'holded-api'
  });
};

// Verify token
export const verifyToken = (token, secret = config.jwt.secret) => {
  try {
    return jwt.verify(token, secret, {
      issuer: 'holded-analysis',
      audience: 'holded-api'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    random: Math.random().toString(36).substring(7)
  };
  
  return generateToken(payload, config.jwt.refreshSecret || config.jwt.secret, '30d');
};

// Generate email verification token
export const generateEmailToken = (email, userId) => {
  const payload = {
    email,
    userId,
    type: 'email_verification'
  };
  
  return generateToken(payload, config.jwt.secret, '24h');
};

// Generate password reset token
export const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset',
    timestamp: Date.now()
  };
  
  return generateToken(payload, config.jwt.secret, '1h');
};

// Decode token without verification (for debugging)
export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

// Extract token from authorization header
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
};

// Token blacklist management (for logout)
const tokenBlacklist = new Set();

export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens periodically
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000); // Remove after 24 hours
};

export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Generate API key
export const generateApiKey = () => {
  const prefix = 'hld_';
  const key = Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
  
  return prefix + key;
};

// Generate API secret
export const generateApiSecret = () => {
  return Array.from({ length: 64 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
};

// Hash API key for storage
export const hashApiKey = (apiKey) => {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
};