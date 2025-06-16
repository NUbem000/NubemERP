import { validationResult } from 'express-validator';
import { handleValidationErrors } from './errorHandler.js';

// Validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = handleValidationErrors(errors);
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
  }
  
  next();
};

// Custom validators
export const validators = {
  // MongoDB ObjectId
  isObjectId: (value) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  },
  
  // Spanish tax ID (NIF/CIF)
  isSpanishTaxId: (value) => {
    const nifRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/i;
    
    if (!nifRegex.test(value) && !cifRegex.test(value)) {
      throw new Error('Invalid Spanish tax ID (NIF/CIF)');
    }
    return true;
  },
  
  // IBAN
  isIBAN: (value) => {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    if (!ibanRegex.test(value)) {
      throw new Error('Invalid IBAN format');
    }
    return true;
  },
  
  // Strong password
  isStrongPassword: (value) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);
    const isLongEnough = value.length >= 8;
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !isLongEnough) {
      throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and numbers');
    }
    return true;
  },
  
  // Phone number
  isPhoneNumber: (value) => {
    const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      throw new Error('Invalid Spanish phone number');
    }
    return true;
  },
  
  // Date range
  isValidDateRange: (startDate, { req }) => {
    const start = new Date(startDate);
    const end = new Date(req.body.endDate || req.query.endDate);
    
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }
    return true;
  },
  
  // File type
  isAllowedFileType: (filename, allowedTypes) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    return true;
  },
  
  // Currency
  isCurrency: (value) => {
    const currencies = ['EUR', 'USD', 'GBP', 'CHF'];
    if (!currencies.includes(value)) {
      throw new Error(`Invalid currency. Allowed: ${currencies.join(', ')}`);
    }
    return true;
  },
  
  // Pagination
  isPaginationValid: (value, { req }) => {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 20);
    
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Invalid pagination parameters');
    }
    return true;
  }
};

// Sanitization helpers
export const sanitizers = {
  // Normalize email
  normalizeEmail: (email) => {
    return email.toLowerCase().trim();
  },
  
  // Clean HTML
  sanitizeHtml: (html) => {
    // Basic HTML sanitization - in production use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  },
  
  // Normalize phone
  normalizePhone: (phone) => {
    return phone.replace(/[\s\-\(\)]/g, '');
  },
  
  // Trim all strings in object
  trimStrings: (obj) => {
    const trimmed = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        trimmed[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimmed[key] = sanitizers.trimStrings(obj[key]);
      } else {
        trimmed[key] = obj[key];
      }
    }
    return trimmed;
  }
};

// Common validation chains
export const commonValidations = {
  pagination: [
    {
      field: 'page',
      validations: ['optional', 'isInt', { options: { min: 1 } }]
    },
    {
      field: 'limit',
      validations: ['optional', 'isInt', { options: { min: 1, max: 100 } }]
    },
    {
      field: 'sort',
      validations: ['optional', 'isString']
    }
  ],
  
  dateRange: [
    {
      field: 'startDate',
      validations: ['optional', 'isISO8601']
    },
    {
      field: 'endDate',
      validations: ['optional', 'isISO8601']
    }
  ],
  
  search: [
    {
      field: 'q',
      validations: ['optional', 'isString', 'trim', { options: { min: 2 } }]
    }
  ]
};