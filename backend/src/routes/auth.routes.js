import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('company.name').trim().isLength({ min: 2, max: 100 }),
  body('company.taxId').optional().trim(),
  body('company.industry').optional().isIn(['retail', 'services', 'manufacturing', 'technology', 'healthcare', 'finance', 'other']),
  body('company.size').optional().isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
];

// Routes
router.post('/register', 
  authLimiter, 
  registerValidation, 
  validate, 
  authController.register
);

router.post('/login', 
  authLimiter, 
  loginValidation, 
  validate, 
  authController.login
);

router.post('/logout', 
  authController.logout
);

router.post('/refresh-token', 
  authController.refreshToken
);

router.post('/forgot-password', 
  authLimiter, 
  forgotPasswordValidation, 
  validate, 
  authController.forgotPassword
);

router.post('/reset-password', 
  authLimiter, 
  resetPasswordValidation, 
  validate, 
  authController.resetPassword
);

router.get('/verify-email/:token', 
  authController.verifyEmail
);

router.post('/resend-verification', 
  authLimiter, 
  body('email').isEmail().normalizeEmail(), 
  validate, 
  authController.resendVerification
);

router.post('/2fa/enable', 
  authController.enable2FA
);

router.post('/2fa/verify', 
  body('token').notEmpty(), 
  validate, 
  authController.verify2FA
);

router.post('/2fa/disable', 
  body('password').notEmpty(), 
  validate, 
  authController.disable2FA
);

export default router;