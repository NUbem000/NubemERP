export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, originalError) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

// Error factory
export const createError = (type, ...args) => {
  const errorTypes = {
    validation: ValidationError,
    auth: AuthenticationError,
    forbidden: AuthorizationError,
    notFound: NotFoundError,
    conflict: ConflictError,
    rateLimit: RateLimitError,
    external: ExternalServiceError
  };
  
  const ErrorClass = errorTypes[type] || AppError;
  return new ErrorClass(...args);
};

// Error response formatter
export const formatErrorResponse = (error) => {
  const response = {
    status: error.status || 'error',
    message: error.message
  };
  
  if (error.code) {
    response.code = error.code;
  }
  
  if (error.errors) {
    response.errors = error.errors;
  }
  
  if (error.retryAfter) {
    response.retryAfter = error.retryAfter;
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
};