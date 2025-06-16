import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from '../config/index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Holded Analysis API',
      version: '1.0.0',
      description: 'Backend API for Holded Analysis Platform - A comprehensive ERP integration system',
      termsOfService: 'https://holded-analysis.com/terms',
      contact: {
        name: 'API Support',
        email: 'api@holded-analysis.com',
        url: 'https://holded-analysis.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.holded-analysis.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error', 'fail']
            },
            message: {
              type: 'string'
            },
            code: {
              type: 'string'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            company: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                taxId: { type: 'string' },
                industry: { type: 'string' },
                size: { type: 'string' }
              }
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer']
            },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['free', 'starter', 'professional', 'enterprise']
                },
                isActive: { type: 'boolean' },
                features: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Module: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            color: { type: 'string' },
            category: {
              type: 'string',
              enum: ['finance', 'operations', 'sales', 'hr', 'system']
            },
            usage: {
              type: 'object',
              properties: {
                percentage: { type: 'number' },
                activeUsers: { type: 'number' }
              }
            },
            features: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  requiredPlan: { type: 'string' }
                }
              }
            }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            number: { type: 'string' },
            type: {
              type: 'string',
              enum: ['invoice', 'credit_note', 'debit_note', 'proforma']
            },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                taxId: { type: 'string' },
                email: { type: 'string' }
              }
            },
            issueDate: { type: 'string', format: 'date' },
            dueDate: { type: 'string', format: 'date' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' },
                  tax: { type: 'object' }
                }
              }
            },
            financial: {
              type: 'object',
              properties: {
                subtotal: { type: 'number' },
                totalTax: { type: 'number' },
                total: { type: 'number' }
              }
            },
            payment: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'partial', 'paid', 'overdue']
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Swagger UI options
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Holded Analysis API Documentation',
    customfavIcon: '/favicon.ico'
  };

  // Setup swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  // Serve OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;