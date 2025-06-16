import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import User from '../src/models/User.js';
import * as emailService from '../src/services/email.service.js';

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'Test1234!',
        name: 'New User',
        company: {
          name: 'New Company',
          taxId: '87654321B',
          industry: 'technology',
          size: '1-10'
        }
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.token).toBeDefined();
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: newUser.email,
          template: 'emailVerification'
        })
      );
    });

    it('should not register user with existing email', async () => {
      const existingUser = await createTestUser();
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: existingUser.user.email,
          password: 'Test1234!',
          name: 'Another User',
          company: { name: 'Another Company' }
        })
        .expect(400);

      expect(response.body.message).toContain('already registered');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
          name: 'Weak Password',
          company: { name: 'Company' }
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('password');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { user } = await createTestUser();
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      await createTestUser();
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login if email not verified', async () => {
      const user = await User.create({
        email: 'unverified@example.com',
        password: 'Test1234!',
        name: 'Unverified User',
        company: { name: 'Company' },
        emailVerified: false
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Test1234!'
        })
        .expect(401);

      expect(response.body.message).toContain('verify your email');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const { user } = await createTestUser();
      
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          template: 'passwordReset'
        })
      );
    });

    it('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await User.create({
        email: 'reset@example.com',
        password: 'OldPassword123!',
        name: 'Reset User',
        company: { name: 'Company' },
        emailVerified: true,
        passwordResetToken: 'valid-reset-token',
        passwordResetExpires: Date.now() + 3600000 // 1 hour
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'NewPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isValid = await updatedUser.comparePassword('NewPassword123!');
      expect(isValid).toBe(true);
    });

    it('should not reset password with expired token', async () => {
      await User.create({
        email: 'expired@example.com',
        password: 'OldPassword123!',
        name: 'Expired User',
        company: { name: 'Company' },
        passwordResetToken: 'expired-token',
        passwordResetExpires: Date.now() - 3600000 // 1 hour ago
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'expired-token',
          password: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  describe('GET /api/v1/auth/verify-email/:token', () => {
    it('should verify email with valid token', async () => {
      const user = await User.create({
        email: 'verify@example.com',
        password: 'Test1234!',
        name: 'Verify User',
        company: { name: 'Company' },
        emailVerified: false,
        emailVerificationToken: 'valid-verification-token',
        emailVerificationExpires: Date.now() + 86400000 // 24 hours
      });

      const response = await request(app)
        .get('/api/v1/auth/verify-email/valid-verification-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify email was verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.emailVerified).toBe(true);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});