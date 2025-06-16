import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const initializeSentry = () => {
  if (!config.monitoring.sentryDsn) {
    logger.info('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: config.monitoring.sentryDsn,
    environment: config.env,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({
        // Specify the app instance if needed
        app: true
      }),
      // Enable profiling
      new ProfilingIntegration(),
      // MongoDB integration
      new Sentry.Integrations.Mongo({
        useMongoose: true
      })
    ],
    
    // Performance Monitoring
    tracesSampleRate: config.isProduction ? 0.1 : 1.0,
    profilesSampleRate: config.isProduction ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.npm_package_version,
    
    // Environment
    environment: config.env,
    
    // Session tracking
    autoSessionTracking: true,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers['x-api-key'];
        }
        
        // Remove sensitive cookies
        if (event.request.cookies) {
          delete event.request.cookies.session;
          delete event.request.cookies.token;
        }
      }
      
      // Filter out specific errors
      const error = hint.originalException;
      
      // Don't send 404 errors
      if (error?.statusCode === 404) {
        return null;
      }
      
      // Don't send validation errors in production
      if (config.isProduction && error?.statusCode === 400) {
        return null;
      }
      
      return event;
    },
    
    // User context
    initialScope: {
      tags: {
        component: 'backend-api'
      }
    }
  });

  logger.info('Sentry initialized successfully');
};

// Middleware to add user context to Sentry
export const sentryUserContext = (req, res, next) => {
  if (req.user) {
    Sentry.setUser({
      id: req.user._id.toString(),
      email: req.user.email,
      username: req.user.name,
      plan: req.user.subscription?.plan,
      company: req.user.company?.name
    });
  }
  next();
};

// Custom error capture with additional context
export const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Add error metadata
    scope.setTag('error.type', error.constructor.name);
    if (error.statusCode) {
      scope.setTag('error.statusCode', error.statusCode);
    }
    if (error.code) {
      scope.setTag('error.code', error.code);
    }
    
    // Capture the error
    Sentry.captureException(error);
  });
};

// Performance monitoring helpers
export const startTransaction = (name, op = 'http.server') => {
  return Sentry.startTransaction({
    name,
    op
  });
};

export const createSpan = (transaction, operation, description) => {
  return transaction.startChild({
    op: operation,
    description
  });
};

// Breadcrumb helpers
export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
};

// Business metrics tracking
export const trackBusinessMetric = (metric, value, tags = {}) => {
  Sentry.metrics.increment(metric, value, {
    tags: {
      environment: config.env,
      ...tags
    }
  });
};

// Custom instrumentation for MongoDB queries
export const instrumentMongoQuery = async (Model, operation, query, callback) => {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction();
  const span = transaction?.startChild({
    op: 'db.mongodb',
    description: `${Model.modelName}.${operation}`
  });

  try {
    const result = await callback();
    span?.setStatus('ok');
    return result;
  } catch (error) {
    span?.setStatus('internal_error');
    throw error;
  } finally {
    span?.finish();
  }
};

// Export Sentry instance for direct usage
export default Sentry;