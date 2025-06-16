import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger.js';

// Configure default metrics collection
collectDefaultMetrics({
  prefix: 'holded_api_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10
});

// Custom metrics
export const metrics = {
  // HTTP metrics
  httpRequestsTotal: new Counter({
    name: 'holded_api_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  httpRequestDuration: new Histogram({
    name: 'holded_api_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  }),
  
  httpRequestSize: new Histogram({
    name: 'holded_api_http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  }),
  
  httpResponseSize: new Histogram({
    name: 'holded_api_http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  }),
  
  // Business metrics
  invoicesCreated: new Counter({
    name: 'holded_api_invoices_created_total',
    help: 'Total number of invoices created',
    labelNames: ['type', 'user_plan']
  }),
  
  invoiceAmount: new Histogram({
    name: 'holded_api_invoice_amount_euros',
    help: 'Invoice amounts in euros',
    labelNames: ['type'],
    buckets: [10, 50, 100, 500, 1000, 5000, 10000]
  }),
  
  activeUsers: new Gauge({
    name: 'holded_api_active_users',
    help: 'Number of active users',
    labelNames: ['plan']
  }),
  
  subscriptionRevenue: new Gauge({
    name: 'holded_api_subscription_revenue_euros',
    help: 'Monthly subscription revenue in euros',
    labelNames: ['plan']
  }),
  
  // Authentication metrics
  authAttempts: new Counter({
    name: 'holded_api_auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['type', 'status']
  }),
  
  // Database metrics
  dbQueries: new Counter({
    name: 'holded_api_db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['collection', 'operation']
  }),
  
  dbQueryDuration: new Histogram({
    name: 'holded_api_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['collection', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  
  // Cache metrics
  cacheHits: new Counter({
    name: 'holded_api_cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type']
  }),
  
  cacheMisses: new Counter({
    name: 'holded_api_cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type']
  }),
  
  // Email metrics
  emailsSent: new Counter({
    name: 'holded_api_emails_sent_total',
    help: 'Total number of emails sent',
    labelNames: ['template', 'status']
  }),
  
  // Error metrics
  errors: new Counter({
    name: 'holded_api_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'code']
  }),
  
  // External API metrics
  externalApiCalls: new Counter({
    name: 'holded_api_external_api_calls_total',
    help: 'Total number of external API calls',
    labelNames: ['service', 'endpoint', 'status']
  }),
  
  externalApiDuration: new Histogram({
    name: 'holded_api_external_api_duration_seconds',
    help: 'External API call duration in seconds',
    labelNames: ['service', 'endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  })
};

// Middleware to collect HTTP metrics
export const initializeMetrics = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Collect request size
    const requestSize = parseInt(req.headers['content-length'] || '0');
    const route = req.route?.path || req.path;
    
    metrics.httpRequestSize.observe(
      { method: req.method, route },
      requestSize
    );
    
    // Intercept response to collect metrics
    const originalSend = res.send;
    res.send = function(data) {
      // Collect response metrics
      const duration = (Date.now() - start) / 1000;
      const responseSize = Buffer.byteLength(data, 'utf8');
      
      metrics.httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode
      });
      
      metrics.httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status_code: res.statusCode
        },
        duration
      );
      
      metrics.httpResponseSize.observe(
        { method: req.method, route },
        responseSize
      );
      
      // Log slow requests
      if (duration > 1) {
        logger.warn('Slow request detected', {
          method: req.method,
          route,
          duration,
          statusCode: res.statusCode
        });
      }
      
      return originalSend.apply(res, arguments);
    };
    
    next();
  };
};

// Endpoint to expose metrics
export const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
};

// Helper functions to track business metrics
export const trackInvoiceCreated = (type, userPlan, amount) => {
  metrics.invoicesCreated.inc({ type, user_plan: userPlan });
  metrics.invoiceAmount.observe({ type }, amount);
};

export const trackAuthAttempt = (type, success) => {
  metrics.authAttempts.inc({
    type,
    status: success ? 'success' : 'failure'
  });
};

export const trackDatabaseQuery = (collection, operation, duration) => {
  metrics.dbQueries.inc({ collection, operation });
  metrics.dbQueryDuration.observe({ collection, operation }, duration);
};

export const trackCacheAccess = (cacheType, hit) => {
  if (hit) {
    metrics.cacheHits.inc({ cache_type: cacheType });
  } else {
    metrics.cacheMisses.inc({ cache_type: cacheType });
  }
};

export const trackEmail = (template, success) => {
  metrics.emailsSent.inc({
    template,
    status: success ? 'sent' : 'failed'
  });
};

export const trackError = (type, code) => {
  metrics.errors.inc({ type, code });
};

export const trackExternalApiCall = (service, endpoint, status, duration) => {
  metrics.externalApiCalls.inc({ service, endpoint, status });
  metrics.externalApiDuration.observe({ service, endpoint }, duration);
};

// Update gauges periodically
export const updateGauges = async () => {
  try {
    // This would typically query the database
    // For now, using mock data
    metrics.activeUsers.set({ plan: 'free' }, 1000);
    metrics.activeUsers.set({ plan: 'starter' }, 500);
    metrics.activeUsers.set({ plan: 'professional' }, 200);
    metrics.activeUsers.set({ plan: 'enterprise' }, 50);
    
    metrics.subscriptionRevenue.set({ plan: 'starter' }, 5000);
    metrics.subscriptionRevenue.set({ plan: 'professional' }, 10000);
    metrics.subscriptionRevenue.set({ plan: 'enterprise' }, 15000);
  } catch (error) {
    logger.error('Error updating gauge metrics:', error);
  }
};

// Start periodic gauge updates
setInterval(updateGauges, 60000); // Update every minute

export default metrics;