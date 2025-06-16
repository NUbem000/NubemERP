import { vi } from 'vitest';
import { config } from '../src/config/index.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock external services
vi.mock('../src/services/email.service.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  sendRawEmail: vi.fn().mockResolvedValue({ success: true }),
  sendBulkEmails: vi.fn().mockResolvedValue([]),
  verifyEmailConfiguration: vi.fn().mockResolvedValue(true)
}));

// MongoDB Memory Server
let mongoServer;

// Setup before all tests
global.beforeAll(async () => {
  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Override config
  config.database.mongoUri = mongoUri;
  
  // Connect to MongoDB
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
global.afterAll(async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database between tests
global.beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.createTestUser = async () => {
  const User = (await import('../src/models/User.js')).default;
  
  const userData = {
    email: 'test@example.com',
    password: 'Test1234!',
    name: 'Test User',
    company: {
      name: 'Test Company',
      taxId: '12345678A',
      industry: 'technology',
      size: '11-50'
    },
    emailVerified: true
  };
  
  const user = await User.create(userData);
  const token = user.generateAuthToken();
  
  return { user, token };
};

global.createTestModule = async () => {
  const Module = (await import('../src/models/Module.js')).default;
  
  const moduleData = {
    id: 'test-module',
    name: 'Test Module',
    description: 'Test module description',
    icon: 'TestIcon',
    color: 'bg-blue-500',
    category: 'finance',
    usage: { percentage: 85 },
    features: [
      {
        id: 'feature1',
        name: 'Feature 1',
        isCore: true,
        requiredPlan: 'free'
      }
    ]
  };
  
  return Module.create(moduleData);
};

global.createTestInvoice = async (userId) => {
  const Invoice = (await import('../src/models/Invoice.js')).default;
  
  const invoiceData = {
    user: userId,
    series: 'TEST',
    type: 'invoice',
    customer: {
      name: 'Test Customer',
      taxId: 'B87654321',
      email: 'customer@example.com'
    },
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [
      {
        product: { name: 'Test Product' },
        description: 'Test product description',
        quantity: 1,
        unitPrice: 100,
        tax: { rate: 21, type: 'IVA' }
      }
    ]
  };
  
  return Invoice.create(invoiceData);
};

// Test request helper
global.testRequest = async (app, method, url, options = {}) => {
  const supertest = await import('supertest');
  const request = supertest.default(app);
  
  let req = request[method.toLowerCase()](url);
  
  if (options.token) {
    req = req.set('Authorization', `Bearer ${options.token}`);
  }
  
  if (options.body) {
    req = req.send(options.body);
  }
  
  if (options.query) {
    req = req.query(options.query);
  }
  
  return req;
};