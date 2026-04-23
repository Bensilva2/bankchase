/**
 * Resend Email Service
 * Handles all transactional email delivery using Resend API
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Send OTP code via email
 */
export async function sendOTPEmail(
  email: string,
  code: string,
  userName: string = 'User'
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Your One-Time Password (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Login</h2>
          <p>Hi ${userName},</p>
          <p>Your one-time password is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="letter-spacing: 10px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #999;">
            This is a security email. Please do not share your OTP with anyone.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
      timestamp: new Date(),
    };
  }
}

/**
 * Send login alert when user logs in from new device/location
 */
export async function sendLoginAlertEmail(
  email: string,
  userName: string,
  deviceInfo: {
    deviceName: string;
    ipAddress: string;
    userAgent?: string;
    timestamp: Date;
  }
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'New Login Alert - Security Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Login Detected</h2>
          <p>Hi ${userName},</p>
          <p>Your account was just accessed from a new device:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Device:</strong> ${deviceInfo.deviceName}</p>
            <p><strong>IP Address:</strong> ${deviceInfo.ipAddress}</p>
            <p><strong>Time:</strong> ${deviceInfo.timestamp.toLocaleString()}</p>
          </div>
          <p>If this was you, no action is needed. If this wasn't you, please:</p>
          <ol>
            <li>Change your password immediately</li>
            <li>Review your active sessions</li>
            <li>Enable 2FA if you haven't already</li>
          </ol>
          <hr />
          <p style="font-size: 12px; color: #999;">
            This is an automated security alert. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send login alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send login alert',
      timestamp: new Date(),
    };
  }
}

/**
 * Send security alert for suspicious activity
 */
export async function sendSecurityAlertEmail(
  email: string,
  userName: string,
  alertType: 'multiple_failed_attempts' | 'impossible_travel' | 'unusual_location' | 'account_locked',
  details?: string
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const alertMessages = {
      multiple_failed_attempts: 'Multiple failed login attempts detected on your account.',
      impossible_travel: 'Login detected from multiple locations too quickly.',
      unusual_location: 'Login detected from an unusual location.',
      account_locked: 'Your account has been temporarily locked for security.',
    };

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Security Alert - Unusual Activity Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">⚠️ Security Alert</h2>
          <p>Hi ${userName},</p>
          <p>${alertMessages[alertType]}</p>
          ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Recommended Actions:</strong></p>
            <ul style="margin-top: 10px;">
              <li>Review your recent login activity</li>
              <li>Change your password if you don't recognize this activity</li>
              <li>Enable or strengthen 2FA</li>
            </ul>
          </div>
          <p>
            <a href="https://yourapp.com/account/security" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">
              Review Account Security
            </a>
          </p>
          <hr />
          <p style="font-size: 12px; color: #999;">
            This is an automated security alert. If you didn't trigger this activity, change your password immediately.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send security alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send security alert',
      timestamp: new Date(),
    };
  }
}

/**
 * Send 2FA verification code
 */
export async function send2FACodeEmail(
  email: string,
  code: string,
  userName: string = 'User'
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Two-Factor Authentication Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two-Factor Authentication</h2>
          <p>Hi ${userName},</p>
          <p>Your 2FA verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="letter-spacing: 10px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>This code expires in 10 minutes.</p>
          <p style="color: #d9534f;"><strong>Never share this code with anyone.</strong></p>
          <hr />
          <p style="font-size: 12px; color: #999;">
            If you didn't request this code, your account may be at risk. Change your password immediately.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send 2FA code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send 2FA code',
      timestamp: new Date(),
    };
  }
}

/**
 * Send welcome email on signup
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${userName}!</h2>
          <p>Thank you for creating an account with us.</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li><strong>Set Up 2FA:</strong> Protect your account with two-factor authentication</li>
            <li><strong>Review Security Settings:</strong> Configure your security preferences</li>
            <li><strong>Explore Features:</strong> Get started with our platform</li>
          </ul>
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Security Tip:</strong> Always use a strong, unique password and enable 2FA for maximum security.</p>
          </div>
          <p>
            <a href="https://yourapp.com/account/security" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">
              Set Up 2FA Now
            </a>
          </p>
          <hr />
          <p style="font-size: 12px; color: #999;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email',
      timestamp: new Date(),
    };
  }
}

/**
 * Send account recovery email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none;">
              Reset Your Password
            </a>
          </p>
          <p>This link expires in 1 hour.</p>
          <p style="color: #999;">If you didn't request this, please ignore this email. Your password won't change without this confirmation.</p>
          <hr />
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      messageId: result.data?.id,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Resend] Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
      timestamp: new Date(),
    };
  }
}
