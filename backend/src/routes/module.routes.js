import { Router } from 'express';
import * as moduleController from '../controllers/module.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { query, param, body } from 'express-validator';

const router = Router();

// Public routes
router.get('/',
  query('category').optional().isIn(['finance', 'operations', 'sales', 'hr', 'system']),
  query('status').optional().isIn(['active', 'maintenance', 'deprecated', 'beta']),
  query('sort').optional().isString(),
  query('fields').optional().isString(),
  validate,
  moduleController.getAllModules
);

// Protected routes - require authentication
router.use(authenticate);

router.get('/:id',
  param('id').notEmpty(),
  validate,
  moduleController.getModule
);

router.get('/:id/stats',
  param('id').notEmpty(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  moduleController.getModuleStats
);

router.put('/:id/settings',
  param('id').notEmpty(),
  body('settings').isObject(),
  validate,
  moduleController.updateModuleSettings
);

router.get('/:moduleId/features/:featureId/availability',
  param('moduleId').notEmpty(),
  param('featureId').notEmpty(),
  validate,
  moduleController.checkFeatureAvailability
);

router.get('/:id/integrations',
  param('id').notEmpty(),
  query('status').optional().isIn(['active', 'beta', 'coming-soon', 'all']),
  validate,
  moduleController.getModuleIntegrations
);

// Admin only routes
router.post('/initialize',
  authorize('admin'),
  moduleController.initializeModules
);

export default router;