import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import moduleRoutes from './module.routes.js';
import invoiceRoutes from './invoice.routes.js';
import projectRoutes from './project.routes.js';
import inventoryRoutes from './inventory.routes.js';
import accountingRoutes from './accounting.routes.js';
import crmRoutes from './crm.routes.js';
import hrRoutes from './hr.routes.js';
import analyticsRoutes from './analytics.routes.js';
import integrationRoutes from './integration.routes.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Module routes (protected)
router.use('/users', userRoutes);
router.use('/modules', moduleRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/projects', projectRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/accounting', accountingRoutes);
router.use('/crm', crmRoutes);
router.use('/hr', hrRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/integrations', integrationRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Holded Analysis API',
    version: '1.0.0',
    description: 'Backend API for Holded ERP Analysis Platform',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      modules: '/api/v1/modules',
      invoices: '/api/v1/invoices',
      projects: '/api/v1/projects',
      inventory: '/api/v1/inventory',
      accounting: '/api/v1/accounting',
      crm: '/api/v1/crm',
      hr: '/api/v1/hr',
      analytics: '/api/v1/analytics',
      integrations: '/api/v1/integrations'
    },
    documentation: '/api-docs'
  });
});

export default router;