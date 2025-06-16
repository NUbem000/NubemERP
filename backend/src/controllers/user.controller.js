import User from '../models/User.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';

// Multer configuration for avatar upload
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadAvatarMiddleware = upload.single('avatar');

// Get current user
export const getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// Update current user
export const updateMe = catchAsync(async (req, res, next) => {
  // Don't allow password updates through this route
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400));
  }

  // Filter allowed fields
  const allowedFields = ['name', 'email', 'profile', 'settings'];
  const filteredBody = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  res.json({
    success: true,
    data: {
      user: updatedUser
    }
  });
});

// Delete current user
export const deleteMe = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  
  // Verify password
  const user = await User.findById(req.user._id).select('+password');
  const isCorrect = await user.comparePassword(password);
  
  if (!isCorrect) {
    return next(new AppError('Incorrect password', 401));
  }
  
  // Soft delete
  await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
    deletedAt: Date.now()
  });

  res.status(204).json({
    success: true,
    data: null
  });
});

// Change password
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Check current password
  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Generate new token
  const token = user.generateAuthToken();
  
  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      token
    }
  });
});

// Upload avatar
export const uploadAvatar = catchAsync(async (req, res, next) => {
  uploadAvatarMiddleware(req, res, async (err) => {
    if (err) return next(err);
    
    if (!req.file) {
      return next(new AppError('Please upload an image', 400));
    }
    
    // Process image
    const filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    const filepath = path.join('uploads', 'avatars', filename);
    
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(filepath);
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.avatar': `/uploads/avatars/${filename}` },
      { new: true }
    );
    
    res.json({
      success: true,
      data: {
        avatar: user.profile.avatar
      }
    });
  });
});

// Get subscription info
export const getSubscription = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      subscription: user.subscription,
      features: user.subscription.features,
      usage: {
        invoices: 150, // Would be calculated from actual usage
        storage: '2.5GB',
        users: 5
      }
    }
  });
});

// Upgrade subscription
export const upgradeSubscription = catchAsync(async (req, res, next) => {
  const { plan, billingCycle = 'monthly' } = req.body;
  
  // Here you would integrate with payment provider (Stripe, etc.)
  // For now, we'll simulate the upgrade
  
  const features = {
    starter: ['basic_invoicing', 'bank_sync', 'basic_support'],
    professional: ['advanced_invoicing', 'bank_sync', 'api_access', 'priority_support'],
    enterprise: ['all_features', 'dedicated_support', 'custom_integrations']
  };
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'subscription.plan': plan,
      'subscription.features': features[plan],
      'subscription.startDate': Date.now(),
      'subscription.endDate': new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
    },
    { new: true }
  );
  
  logger.info('Subscription upgraded', {
    userId: user._id,
    plan,
    billingCycle
  });
  
  res.json({
    success: true,
    message: 'Subscription upgraded successfully',
    data: {
      subscription: user.subscription
    }
  });
});

// Cancel subscription
export const cancelSubscription = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'subscription.plan': 'free',
      'subscription.isActive': false,
      'subscription.features': []
    },
    { new: true }
  );
  
  logger.info('Subscription cancelled', {
    userId: user._id,
    reason
  });
  
  res.json({
    success: true,
    message: 'Subscription cancelled',
    data: {
      subscription: user.subscription
    }
  });
});

// Get API keys
export const getApiKeys = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+apiAccess.apiKey');
  
  if (!user.apiAccess.enabled) {
    return res.json({
      success: true,
      data: {
        keys: []
      }
    });
  }
  
  res.json({
    success: true,
    data: {
      keys: [{
        id: user._id,
        name: 'Default API Key',
        key: user.apiAccess.apiKey,
        created: user.createdAt
      }]
    }
  });
});

// Create API key
export const createApiKey = catchAsync(async (req, res, next) => {
  const { name, permissions } = req.body;
  
  // Enable API access and generate credentials
  const user = await User.findById(req.user._id);
  user.apiAccess.enabled = true;
  await user.save();
  
  res.json({
    success: true,
    message: 'API key created successfully',
    data: {
      key: user.apiAccess.apiKey,
      secret: user.apiAccess.apiSecret
    }
  });
});

// Delete API key
export const deleteApiKey = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    'apiAccess.enabled': false,
    $unset: {
      'apiAccess.apiKey': 1,
      'apiAccess.apiSecret': 1
    }
  });
  
  res.json({
    success: true,
    message: 'API key deleted successfully'
  });
});

// Admin functions

// Get all users
export const getAllUsers = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    role,
    plan,
    search
  } = req.query;
  
  // Build query
  const query = { isActive: true };
  if (role) query.role = role;
  if (plan) query['subscription.plan'] = plan;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'company.name': { $regex: search, $options: 'i' } }
    ];
  }
  
  // Execute query with pagination
  const users = await User.find(query)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await User.countDocuments(query);
  
  res.json({
    success: true,
    results: users.length,
    total,
    pages: Math.ceil(total / limit),
    page: parseInt(page),
    data: users
  });
});

// Get specific user
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new NotFoundError('User'));
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Update user
export const updateUser = catchAsync(async (req, res, next) => {
  const allowedUpdates = ['role', 'isActive', 'permissions', 'subscription'];
  const updates = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return next(new NotFoundError('User'));
  }
  
  logger.info('User updated by admin', {
    adminId: req.user._id,
    userId: user._id,
    updates
  });
  
  res.json({
    success: true,
    data: user
  });
});

// Delete user
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
      deletedAt: Date.now()
    }
  );
  
  if (!user) {
    return next(new NotFoundError('User'));
  }
  
  logger.info('User deleted by admin', {
    adminId: req.user._id,
    userId: user._id
  });
  
  res.status(204).json({
    success: true,
    data: null
  });
});

// Impersonate user
export const impersonateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user || !user.isActive) {
    return next(new NotFoundError('User'));
  }
  
  // Generate token for impersonated user
  const token = user.generateAuthToken();
  
  logger.warn('User impersonation', {
    adminId: req.user._id,
    impersonatedUserId: user._id
  });
  
  res.json({
    success: true,
    message: 'Impersonation token generated',
    data: {
      token,
      user
    }
  });
});