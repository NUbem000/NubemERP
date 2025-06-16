import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize, checkFeature } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getMe);

// Update current user profile
router.patch('/me',
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('settings.language').optional().isIn(['es', 'en', 'ca', 'fr', 'de']),
  body('settings.timezone').optional().isString(),
  body('settings.currency').optional().isIn(['EUR', 'USD', 'GBP']),
  body('settings.notifications').optional().isObject(),
  body('profile').optional().isObject(),
  validate,
  userController.updateMe
);

// Delete current user
router.delete('/me',
  body('password').notEmpty(),
  validate,
  userController.deleteMe
);

// Change password
router.put('/change-password',
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  validate,
  userController.changePassword
);

// Upload avatar
router.post('/avatar',
  uploadLimiter,
  userController.uploadAvatar
);

// Get subscription info
router.get('/subscription', userController.getSubscription);

// Upgrade subscription
router.post('/subscription/upgrade',
  body('plan').isIn(['starter', 'professional', 'enterprise']),
  body('billingCycle').optional().isIn(['monthly', 'yearly']),
  validate,
  userController.upgradeSubscription
);

// Cancel subscription
router.post('/subscription/cancel',
  body('reason').optional().isString(),
  validate,
  userController.cancelSubscription
);

// API key management
router.get('/api-keys',
  checkFeature('api_access'),
  userController.getApiKeys
);

router.post('/api-keys',
  checkFeature('api_access'),
  body('name').notEmpty().trim(),
  body('permissions').optional().isArray(),
  validate,
  userController.createApiKey
);

router.delete('/api-keys/:keyId',
  checkFeature('api_access'),
  param('keyId').isMongoId(),
  validate,
  userController.deleteApiKey
);

// Admin only routes
router.use(authorize('admin'));

// Get all users (admin)
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isString(),
  query('role').optional().isIn(['admin', 'user', 'viewer']),
  query('plan').optional().isIn(['free', 'starter', 'professional', 'enterprise']),
  query('search').optional().isString(),
  validate,
  userController.getAllUsers
);

// Get specific user (admin)
router.get('/:id',
  param('id').isMongoId(),
  validate,
  userController.getUser
);

// Update user (admin)
router.patch('/:id',
  param('id').isMongoId(),
  body('role').optional().isIn(['admin', 'user', 'viewer']),
  body('isActive').optional().isBoolean(),
  body('permissions').optional().isObject(),
  body('subscription').optional().isObject(),
  validate,
  userController.updateUser
);

// Delete user (admin)
router.delete('/:id',
  param('id').isMongoId(),
  validate,
  userController.deleteUser
);

// Impersonate user (admin)
router.post('/:id/impersonate',
  param('id').isMongoId(),
  validate,
  userController.impersonateUser
);

export default router;