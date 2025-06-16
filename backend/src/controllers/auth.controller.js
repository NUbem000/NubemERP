import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../services/email.service.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

// Register new user
export const register = async (req, res, next) => {
  try {
    const { email, password, name, company } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }
    
    // Create user
    const user = new User({
      email,
      password,
      name,
      company,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    
    await user.save();
    
    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${user.emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Holded Analysis account',
      template: 'emailVerification',
      data: {
        name: user.name,
        verificationUrl
      }
    });
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    // Remove sensitive data
    user.password = undefined;
    user.emailVerificationToken = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user and verify credentials
    const user = await User.findByCredentials(email, password);
    
    // Check if email is verified
    if (!user.emailVerified) {
      throw new AppError('Please verify your email before logging in', 401);
    }
    
    // Generate auth token
    const token = user.generateAuthToken();
    
    // Update last login
    user.security.lastLogin = Date.now();
    await user.save();
    
    // Remove sensitive data
    user.password = undefined;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // However, we can blacklist the token if needed
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded._id);
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }
    
    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = generateToken(
      { _id: user._id }, 
      config.jwt.refreshSecret, 
      '30d'
    );
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    user.passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();
    
    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${user.passwordResetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      template: 'passwordReset',
      data: {
        name: user.name,
        resetUrl
      }
    });
    
    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
    
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }
    
    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password changed successfully',
      template: 'passwordChanged',
      data: {
        name: user.name
      }
    });
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
    
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }
    
    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Resend verification email
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || user.emailVerified) {
      return res.json({
        success: true,
        message: 'If your email is registered and unverified, you will receive a verification link'
      });
    }
    
    // Generate new verification token
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();
    
    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${user.emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your Holded Analysis account',
      template: 'emailVerification',
      data: {
        name: user.name,
        verificationUrl
      }
    });
    
    res.json({
      success: true,
      message: 'If your email is registered and unverified, you will receive a verification link'
    });
    
  } catch (error) {
    next(error);
  }
};

// Enable 2FA
export const enable2FA = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('+security.twoFactorSecret');
    
    if (user.security.twoFactorEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Holded Analysis (${user.email})`
    });
    
    user.security.twoFactorSecret = secret.base32;
    await user.save();
    
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: secret.otpauth_url
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Verify 2FA
export const verify2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('+security.twoFactorSecret');
    
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      throw new AppError('Invalid 2FA token', 400);
    }
    
    user.security.twoFactorEnabled = true;
    await user.save();
    
    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
export const disable2FA = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid password', 401);
    }
    
    user.security.twoFactorEnabled = false;
    user.security.twoFactorSecret = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
    
  } catch (error) {
    next(error);
  }
};