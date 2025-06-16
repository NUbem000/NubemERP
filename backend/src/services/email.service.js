import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create transporter
const createTransporter = () => {
  if (config.env === 'test') {
    // Use Ethereal email for testing
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
  
  return nodemailer.createTransporter(config.email.smtp);
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  emailVerification: {
    subject: 'Verify your Holded Analysis account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Holded Analysis!</h1>
        <p>Hi {{name}},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </div>
        <p>Or copy and paste this link: {{verificationUrl}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Holded Analysis Team</p>
      </div>
    `
  },
  
  passwordReset: {
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hi {{name}},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </div>
        <p>Or copy and paste this link: {{resetUrl}}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Holded Analysis Team</p>
      </div>
    `
  },
  
  passwordChanged: {
    subject: 'Password changed successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Changed</h1>
        <p>Hi {{name}},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The Holded Analysis Team</p>
      </div>
    `
  },
  
  invoiceCreated: {
    subject: 'Invoice {{invoiceNumber}} created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Invoice Created</h1>
        <p>Hi {{customerName}},</p>
        <p>Invoice {{invoiceNumber}} has been created for the amount of {{amount}}.</p>
        <p>Due date: {{dueDate}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{invoiceUrl}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Invoice</a>
        </div>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>{{companyName}}</p>
      </div>
    `
  },
  
  paymentReceived: {
    subject: 'Payment received for invoice {{invoiceNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Payment Received</h1>
        <p>Hi {{customerName}},</p>
        <p>We've received your payment of {{amount}} for invoice {{invoiceNumber}}.</p>
        <p>Thank you for your prompt payment!</p>
        <p>Best regards,<br>{{companyName}}</p>
      </div>
    `
  },
  
  trialEnding: {
    subject: 'Your trial ends in {{daysLeft}} days',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Trial Ending Soon</h1>
        <p>Hi {{name}},</p>
        <p>Your Holded Analysis trial will end in {{daysLeft}} days.</p>
        <p>To continue enjoying all features, please upgrade your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{upgradeUrl}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Upgrade Now</a>
        </div>
        <p>Best regards,<br>The Holded Analysis Team</p>
      </div>
    `
  }
};

// Replace template variables
const replaceTemplateVars = (template, data) => {
  let result = template;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key]);
  });
  
  return result;
};

// Send email
export const sendEmail = async ({ to, subject, template, data = {}, attachments = [] }) => {
  try {
    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }
    
    // Prepare email content
    const html = replaceTemplateVars(emailTemplate.html, data);
    const finalSubject = replaceTemplateVars(emailTemplate.subject || subject, data);
    
    // Send email
    const mailOptions = {
      from: `Holded Analysis <${config.email.from}>`,
      to,
      subject: finalSubject,
      html,
      attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to,
      template,
      subject: finalSubject
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to,
      template
    });
    
    throw error;
  }
};

// Send raw email (without template)
export const sendRawEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `Holded Analysis <${config.email.from}>`,
      to,
      subject,
      html,
      text,
      attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Raw email sent successfully', {
      messageId: info.messageId,
      to,
      subject
    });
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    logger.error('Failed to send raw email', {
      error: error.message,
      to,
      subject
    });
    
    throw error;
  }
};

// Send bulk emails
export const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({
        ...result,
        to: email.to,
        status: 'sent'
      });
    } catch (error) {
      results.push({
        to: email.to,
        status: 'failed',
        error: error.message
      });
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Verify transporter configuration
export const verifyEmailConfiguration = async () => {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
};

// Queue email for later sending (integration with Bull queue)
export const queueEmail = async (emailData, delay = 0) => {
  // This would integrate with the queue service
  // For now, just send immediately
  return sendEmail(emailData);
};

// Email analytics
export const trackEmailEvent = async (messageId, event, data = {}) => {
  logger.info('Email event tracked', {
    messageId,
    event,
    ...data
  });
  
  // Here you would integrate with email analytics service
  // like SendGrid, Mailgun, etc.
};