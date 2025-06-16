import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Connection options
const mongooseOptions = {
  ...config.database.options,
  autoIndex: config.env !== 'production',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connection state
let isConnected = false;

// Connect to MongoDB
export const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB is already connected');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...');
    
    await mongoose.connect(config.database.mongoUri, mongooseOptions);
    
    isConnected = true;
    logger.info('MongoDB connected successfully');
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      isConnected = false;
    });
    
    // Enable query logging in development
    if (config.isDevelopment) {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug({
          type: 'mongodb-query',
          collection: collectionName,
          method,
          query: JSON.stringify(query),
          doc: doc ? JSON.stringify(doc) : undefined
        });
      });
    }
    
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Disconnect from MongoDB
export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Check connection status
export const checkConnection = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const state = mongoose.connection.readyState;
  
  return {
    isConnected: state === 1,
    state: states[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

// Health check for database
export const healthCheck = async () => {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }
    
    // Ping database
    await mongoose.connection.db.admin().ping();
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    
    return {
      status: 'healthy',
      connected: true,
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      avgObjSize: stats.avgObjSize
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
};

// Create indexes
export const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...');
    
    // Get all models
    const models = mongoose.models;
    
    for (const modelName in models) {
      const model = models[modelName];
      await model.createIndexes();
      logger.info(`Indexes created for ${modelName}`);
    }
    
    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

// Database maintenance tasks
export const runMaintenanceTasks = async () => {
  try {
    logger.info('Running database maintenance tasks...');
    
    // Compact collections
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await mongoose.connection.db.command({
        compact: collection.collectionName,
        force: true
      });
    }
    
    // Update statistics
    await mongoose.connection.db.command({ dbStats: 1 });
    
    logger.info('Database maintenance completed');
  } catch (error) {
    logger.error('Database maintenance failed:', error);
  }
};

// Transaction helper
export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Export mongoose instance for direct access if needed
export { mongoose };