import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  icon: {
    type: String,
    required: true
  },
  
  color: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['finance', 'operations', 'sales', 'hr', 'system'],
    required: true
  },
  
  usage: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  features: [{
    id: String,
    name: String,
    description: String,
    isCore: { type: Boolean, default: false },
    requiredPlan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    }
  }],
  
  integrations: [{
    name: String,
    provider: String,
    type: {
      type: String,
      enum: ['native', 'api', 'webhook', 'import/export']
    },
    status: {
      type: String,
      enum: ['active', 'beta', 'coming-soon'],
      default: 'active'
    }
  }],
  
  configuration: {
    settings: [{
      key: String,
      label: String,
      type: {
        type: String,
        enum: ['boolean', 'string', 'number', 'select', 'multiselect']
      },
      defaultValue: mongoose.Schema.Types.Mixed,
      options: [mongoose.Schema.Types.Mixed],
      validation: {
        required: Boolean,
        min: Number,
        max: Number,
        pattern: String
      }
    }],
    
    permissions: [{
      action: String,
      resource: String,
      roles: [String]
    }]
  },
  
  pricing: {
    basePrice: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    tiers: [{
      name: String,
      minUsers: Number,
      maxUsers: Number,
      pricePerUser: Number
    }]
  },
  
  analytics: {
    totalTransactions: { type: Number, default: 0 },
    monthlyTransactions: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    satisfactionScore: { type: Number, min: 0, max: 5, default: 0 }
  },
  
  documentation: {
    quickStartUrl: String,
    apiDocsUrl: String,
    tutorialsUrl: String,
    supportEmail: String
  },
  
  status: {
    type: String,
    enum: ['active', 'maintenance', 'deprecated', 'beta'],
    default: 'active'
  },
  
  isEnabled: {
    type: Boolean,
    default: true
  },
  
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
moduleSchema.index({ id: 1 });
moduleSchema.index({ category: 1 });
moduleSchema.index({ status: 1 });
moduleSchema.index({ 'usage.percentage': -1 });

// Static method to get module statistics
moduleSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $match: { isEnabled: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgUsage: { $avg: '$usage.percentage' },
        totalUsers: { $sum: '$usage.activeUsers' }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        avgUsage: { $round: ['$avgUsage', 2] },
        totalUsers: 1,
        _id: 0
      }
    }
  ]);
  
  return stats;
};

// Instance method to check if feature is available for plan
moduleSchema.methods.isFeatureAvailable = function(featureId, userPlan) {
  const feature = this.features.find(f => f.id === featureId);
  if (!feature) return false;
  
  const planHierarchy = ['free', 'starter', 'professional', 'enterprise'];
  const featurePlanIndex = planHierarchy.indexOf(feature.requiredPlan);
  const userPlanIndex = planHierarchy.indexOf(userPlan);
  
  return userPlanIndex >= featurePlanIndex;
};

const Module = mongoose.model('Module', moduleSchema);

export default Module;