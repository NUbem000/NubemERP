import { logger } from '../utils/logger.js';
import { AppError, formatErrorResponse } from '../utils/AppError.js';
import { config } from '../config/index.js';

// MongoDB/Mongoose error handlers
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message
  }));
  
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
};

// JWT error handlers
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again', 401, 'TOKEN_EXPIRED');

// Development error response
const sendErrorDev = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      code: err.code
    });
  }
  
  // Rendered website errors
  logger.error('ERROR 💥', err);
  res.status(err.statusCode).json({
    title: 'Something went wrong!',
    message: err.message
  });
};

// Production error response
const sendErrorProd = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json(formatErrorResponse(err));
    }
    
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
  
  // Rendered website errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      title: 'Something went wrong!',
      message: err.message
    });
  }
  
  // Programming or other unknown error
  logger.error('ERROR 💥', err);
  res.status(err.statusCode).json({
    title: 'Something went wrong!',
    message: 'Please try again later.'
  });
};

// Main error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Set default values
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  
  // Log error
  logger.error({
    message: error.message,
    statusCode: error.statusCode,
    status: error.status,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  });
  
  // Handle specific error types
  if (err.name === 'CastError') error = handleCastErrorDB(error);
  if (err.code === 11000) error = handleDuplicateFieldsDB(error);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Send error response
  if (config.env === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404, 'NOT_FOUND');
  next(err);
};

// Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Validation error formatter
export const handleValidationErrors = (errors) => {
  const formattedErrors = errors.array().map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));
  
  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
};