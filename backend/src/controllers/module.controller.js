import Module from '../models/Module.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

// Get all modules
export const getAllModules = catchAsync(async (req, res, next) => {
  const { 
    category, 
    status = 'active', 
    sort = '-usage.percentage',
    fields
  } = req.query;
  
  // Build query
  const query = { isEnabled: true };
  if (category) query.category = category;
  if (status) query.status = status;
  
  // Execute query
  let modulesQuery = Module.find(query);
  
  // Sorting
  if (sort) {
    const sortBy = sort.split(',').join(' ');
    modulesQuery = modulesQuery.sort(sortBy);
  }
  
  // Field limiting
  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    modulesQuery = modulesQuery.select(fieldsList);
  }
  
  const modules = await modulesQuery;
  
  // Get statistics
  const stats = await Module.getStatistics();
  
  res.json({
    success: true,
    results: modules.length,
    data: {
      modules,
      statistics: stats
    }
  });
});

// Get single module
export const getModule = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const module = await Module.findOne({ 
    $or: [{ _id: id }, { id: id }] 
  });
  
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Check if user has access to this module
  if (!req.user.hasPermission(module.id)) {
    return next(new AppError('You do not have access to this module', 403));
  }
  
  // Increment usage analytics
  await Module.findByIdAndUpdate(module._id, {
    $inc: { 'analytics.monthlyTransactions': 1 }
  });
  
  res.json({
    success: true,
    data: module
  });
});

// Update module settings
export const updateModuleSettings = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { settings } = req.body;
  
  const module = await Module.findOne({ 
    $or: [{ _id: id }, { id: id }] 
  });
  
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // Check permissions
  if (!req.user.hasPermission(module.id) || req.user.role !== 'admin') {
    return next(new AppError('Insufficient permissions', 403));
  }
  
  // Validate settings against module configuration
  const validSettings = {};
  for (const setting of module.configuration.settings) {
    if (settings[setting.key] !== undefined) {
      // Validate setting value
      const value = settings[setting.key];
      
      switch (setting.type) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            return next(new AppError(`${setting.key} must be a boolean`, 400));
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            return next(new AppError(`${setting.key} must be a number`, 400));
          }
          if (setting.validation.min && value < setting.validation.min) {
            return next(new AppError(`${setting.key} must be at least ${setting.validation.min}`, 400));
          }
          if (setting.validation.max && value > setting.validation.max) {
            return next(new AppError(`${setting.key} must be at most ${setting.validation.max}`, 400));
          }
          break;
        case 'select':
          if (!setting.options.includes(value)) {
            return next(new AppError(`Invalid value for ${setting.key}`, 400));
          }
          break;
      }
      
      validSettings[setting.key] = value;
    }
  }
  
  // Save user-specific settings
  if (!req.user.moduleSettings) {
    req.user.moduleSettings = {};
  }
  req.user.moduleSettings[module.id] = validSettings;
  await req.user.save();
  
  res.json({
    success: true,
    data: {
      module: module.id,
      settings: validSettings
    }
  });
});

// Get module usage statistics
export const getModuleStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;
  
  const module = await Module.findOne({ 
    $or: [{ _id: id }, { id: id }] 
  });
  
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  // This would typically aggregate from a separate analytics collection
  const stats = {
    module: module.id,
    period: {
      start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate || new Date()
    },
    usage: {
      totalTransactions: module.analytics.totalTransactions,
      monthlyTransactions: module.analytics.monthlyTransactions,
      averageResponseTime: module.analytics.averageResponseTime,
      errorRate: module.analytics.errorRate,
      satisfactionScore: module.analytics.satisfactionScore
    },
    trends: {
      transactionsGrowth: '+15%',
      responseTimeChange: '-5%',
      errorRateChange: '-2%'
    }
  };
  
  res.json({
    success: true,
    data: stats
  });
});

// Check feature availability
export const checkFeatureAvailability = catchAsync(async (req, res, next) => {
  const { moduleId, featureId } = req.params;
  
  const module = await Module.findOne({ 
    $or: [{ _id: moduleId }, { id: moduleId }] 
  });
  
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  const userPlan = req.user.subscription.plan;
  const isAvailable = module.isFeatureAvailable(featureId, userPlan);
  
  const feature = module.features.find(f => f.id === featureId);
  
  res.json({
    success: true,
    data: {
      available: isAvailable,
      feature: feature || null,
      userPlan,
      requiredPlan: feature?.requiredPlan
    }
  });
});

// Get module integrations
export const getModuleIntegrations = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status = 'active' } = req.query;
  
  const module = await Module.findOne({ 
    $or: [{ _id: id }, { id: id }] 
  });
  
  if (!module) {
    return next(new AppError('Module not found', 404));
  }
  
  const integrations = module.integrations.filter(int => 
    status === 'all' || int.status === status
  );
  
  res.json({
    success: true,
    data: {
      module: module.id,
      integrations,
      total: integrations.length
    }
  });
});

// Initialize modules (admin only)
export const initializeModules = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  
  // Default modules data
  const defaultModules = [
    {
      id: 'invoicing',
      name: 'Facturación',
      description: 'Sistema completo de facturación electrónica con cumplimiento normativo',
      icon: 'Calculator',
      color: 'bg-blue-500',
      category: 'finance',
      usage: { percentage: 95 },
      features: [
        { id: 'electronic-invoice', name: 'Facturación electrónica', isCore: true, requiredPlan: 'free' },
        { id: 'templates', name: '100+ plantillas', isCore: true, requiredPlan: 'starter' },
        { id: 'recurring', name: 'Facturas recurrentes', isCore: false, requiredPlan: 'professional' }
      ]
    },
    {
      id: 'accounting',
      name: 'Contabilidad',
      description: 'Automatización del 95% de tareas contables con IA',
      icon: 'BarChart3',
      color: 'bg-green-500',
      category: 'finance',
      usage: { percentage: 88 },
      features: [
        { id: 'automation', name: 'Automatización IA', isCore: true, requiredPlan: 'starter' },
        { id: 'bank-sync', name: 'Sincronización bancaria', isCore: true, requiredPlan: 'starter' },
        { id: 'tax-models', name: 'Modelos fiscales', isCore: false, requiredPlan: 'professional' }
      ]
    },
    {
      id: 'projects',
      name: 'Proyectos',
      description: 'Gestión profesional de proyectos con metodologías ágiles',
      icon: 'FolderKanban',
      color: 'bg-purple-500',
      category: 'operations',
      usage: { percentage: 75 },
      features: [
        { id: 'kanban', name: 'Tableros Kanban', isCore: true, requiredPlan: 'free' },
        { id: 'gantt', name: 'Diagramas Gantt', isCore: false, requiredPlan: 'professional' },
        { id: 'time-tracking', name: 'Control de tiempo', isCore: true, requiredPlan: 'starter' }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventario',
      description: 'Control total del stock en tiempo real',
      icon: 'Package',
      color: 'bg-orange-500',
      category: 'operations',
      usage: { percentage: 82 },
      features: [
        { id: 'multi-warehouse', name: 'Multialmacén', isCore: true, requiredPlan: 'professional' },
        { id: 'variants', name: 'Variantes de producto', isCore: true, requiredPlan: 'starter' },
        { id: 'serial-numbers', name: 'Números de serie', isCore: false, requiredPlan: 'professional' }
      ]
    },
    {
      id: 'hr',
      name: 'Recursos Humanos',
      description: 'Gestión integral del equipo y control horario',
      icon: 'Users',
      color: 'bg-red-500',
      category: 'hr',
      usage: { percentage: 70 },
      features: [
        { id: 'employee-database', name: 'Base de datos empleados', isCore: true, requiredPlan: 'free' },
        { id: 'time-control', name: 'Control horario', isCore: true, requiredPlan: 'starter' },
        { id: 'payroll', name: 'Nóminas', isCore: false, requiredPlan: 'professional' }
      ]
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Gestión inteligente de relaciones con clientes',
      icon: 'UserCheck',
      color: 'bg-indigo-500',
      category: 'sales',
      usage: { percentage: 85 },
      features: [
        { id: 'sales-pipeline', name: 'Embudo de ventas', isCore: true, requiredPlan: 'free' },
        { id: 'lead-scoring', name: 'Puntuación de leads', isCore: false, requiredPlan: 'professional' },
        { id: 'email-automation', name: 'Automatización email', isCore: false, requiredPlan: 'professional' }
      ]
    },
    {
      id: 'pos',
      name: 'TPV',
      description: 'Terminal punto de venta omnicanal',
      icon: 'CreditCard',
      color: 'bg-yellow-500',
      category: 'sales',
      usage: { percentage: 65 },
      features: [
        { id: 'tablet-pos', name: 'TPV en tablet', isCore: true, requiredPlan: 'starter' },
        { id: 'offline-mode', name: 'Modo offline', isCore: true, requiredPlan: 'professional' },
        { id: 'multi-payment', name: 'Múltiples pagos', isCore: true, requiredPlan: 'starter' }
      ]
    },
    {
      id: 'system',
      name: 'Sistema',
      description: 'Infraestructura y administración avanzada',
      icon: 'Settings',
      color: 'bg-gray-500',
      category: 'system',
      usage: { percentage: 90 },
      features: [
        { id: 'user-management', name: 'Gestión usuarios', isCore: true, requiredPlan: 'free' },
        { id: 'api-access', name: 'Acceso API', isCore: false, requiredPlan: 'professional' },
        { id: 'multi-company', name: 'Multiempresa', isCore: false, requiredPlan: 'enterprise' }
      ]
    }
  ];
  
  // Create or update modules
  const results = [];
  for (const moduleData of defaultModules) {
    const module = await Module.findOneAndUpdate(
      { id: moduleData.id },
      moduleData,
      { upsert: true, new: true }
    );
    results.push(module);
  }
  
  logger.info('Modules initialized successfully', { count: results.length });
  
  res.json({
    success: true,
    message: 'Modules initialized successfully',
    data: {
      count: results.length,
      modules: results
    }
  });
});