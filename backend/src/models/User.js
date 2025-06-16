import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    taxId: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      enum: ['retail', 'services', 'manufacturing', 'technology', 'healthcare', 'finance', 'other'],
      default: 'other'
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '1-10'
    }
  },
  
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  
  permissions: {
    invoicing: { type: Boolean, default: true },
    accounting: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    inventory: { type: Boolean, default: true },
    hr: { type: Boolean, default: true },
    crm: { type: Boolean, default: true },
    pos: { type: Boolean, default: true },
    system: { type: Boolean, default: false }
  },
  
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    features: [{
      type: String
    }]
  },
  
  settings: {
    language: {
      type: String,
      enum: ['es', 'en', 'ca', 'fr', 'de'],
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'Europe/Madrid'
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  profile: {
    avatar: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'ES' }
    }
  },
  
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    lastLogin: Date,
    lastPasswordChange: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date
  },
  
  apiAccess: {
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, select: false },
    apiSecret: { type: String, select: false },
    webhookUrl: String,
    rateLimitOverride: Number
  },
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'company.name': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.isActive': 1 });

// Virtual for full address
userSchema.virtual('profile.fullAddress').get(function() {
  const addr = this.profile.address;
  if (!addr) return '';
  return [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);
    this.security.lastPasswordChange = Date.now();
  }
  
  // Generate API credentials if enabled
  if (this.isModified('apiAccess.enabled') && this.apiAccess.enabled && !this.apiAccess.apiKey) {
    this.apiAccess.apiKey = this.generateApiKey();
    this.apiAccess.apiSecret = this.generateApiSecret();
  }
  
  next();
});

// Instance methods
userSchema.methods = {
  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  },
  
  // Generate JWT token
  generateAuthToken() {
    const payload = {
      _id: this._id,
      email: this.email,
      role: this.role,
      company: this.company.name
    };
    
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  },
  
  // Generate API key
  generateApiKey() {
    return `hld_${Buffer.from(this._id.toString()).toString('base64')}`;
  },
  
  // Generate API secret
  generateApiSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  },
  
  // Handle failed login attempts
  incLoginAttempts() {
    // Reset attempts if lock expired
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
      return this.updateOne({
        $set: { 'security.loginAttempts': 1 },
        $unset: { 'security.lockUntil': 1 }
      });
    }
    
    const updates = { $inc: { 'security.loginAttempts': 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Lock account after max attempts
    if (this.security.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
      updates.$set = { 'security.lockUntil': Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
  },
  
  // Reset login attempts
  resetLoginAttempts() {
    return this.updateOne({
      $set: { 'security.loginAttempts': 0, 'security.lastLogin': Date.now() },
      $unset: { 'security.lockUntil': 1 }
    });
  },
  
  // Check module permission
  hasPermission(module) {
    return this.permissions[module] === true;
  },
  
  // Check subscription feature
  hasFeature(feature) {
    return this.subscription.isActive && 
           this.subscription.features.includes(feature);
  }
};

// Static methods
userSchema.statics = {
  // Find by credentials
  async findByCredentials(email, password) {
    const user = await this.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (user.isLocked) {
      throw new Error('Account is locked due to too many failed attempts');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      throw new Error('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    await user.resetLoginAttempts();
    return user;
  }
};

const User = mongoose.model('User', userSchema);

export default User;