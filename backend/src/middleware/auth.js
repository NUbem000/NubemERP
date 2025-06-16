import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

// Authenticate user
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Find user
    const user = await User.findById(decoded._id).select('-password');
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

// Check user role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};

// Check module permission
export const checkModuleAccess = (module) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!req.user.hasPermission(module)) {
      return next(new AppError(`Access denied to ${module} module`, 403));
    }
    
    next();
  };
};

// Check subscription plan
export const checkPlan = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!req.user.subscription.isActive) {
      return next(new AppError('Subscription inactive', 403));
    }
    
    if (!plans.includes(req.user.subscription.plan)) {
      return next(new AppError('Feature not available in your plan', 403));
    }
    
    next();
  };
};

// Check feature access
export const checkFeature = (feature) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!req.user.hasFeature(feature)) {
      return next(new AppError(`Feature "${feature}" not available in your plan`, 403));
    }
    
    next();
  };
};

// API key authentication
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];
    
    if (!apiKey || !apiSecret) {
      throw new AppError('API credentials required', 401);
    }
    
    // Find user by API key
    const user = await User.findOne({
      'apiAccess.enabled': true,
      'apiAccess.apiKey': apiKey,
      'apiAccess.apiSecret': apiSecret
    }).select('-password');
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid API credentials', 401);
    }
    
    // Attach user to request
    req.user = user;
    req.isApiAuth = true;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (for public endpoints that may have enhanced features for authenticated users)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded._id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Invalid token, continue without auth
    }
    
    next();
  } catch (error) {
    next(error);
  }
};