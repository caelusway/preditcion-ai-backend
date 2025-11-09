import { env } from '../config/env';
import { logger } from '../lib/logger';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${env.NODE_ENV === 'production' ? 'https://api.yourdomain.com' : 'http://localhost:' + env.PORT}/auth/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify your email address',
      text: `Please verify your email by clicking: ${verificationUrl}`,
      html: `
        <h1>Welcome to AI Football Predictions!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or copy and paste this URL: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // For mobile app deep linking, use the mobile app URL
    // For web-based reset, use the API URL directly
    const resetUrl = `${env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:19000'}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click here to reset: ${resetUrl}`,
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
        <p>Or copy and paste this URL: ${resetUrl}</p>
        <p><strong>Token:</strong> ${token}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  private async send(options: EmailOptions): Promise<void> {
    if (env.EMAIL_PROVIDER === 'console') {
      logger.info(
        {
          to: options.to,
          subject: options.subject,
          text: options.text,
        },
        '📧 Email sent (console mode)'
      );
      return;
    }

    if (env.EMAIL_PROVIDER === 'resend') {
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const resend = new Resend(env.RESEND_API_KEY);

      try {
        const { data, error } = await resend.emails.send({
          from: env.EMAIL_FROM,
          to: [options.to],
          subject: options.subject,
          html: options.html || options.text,
        });

        if (error) {
          logger.error({ error, to: options.to }, 'Failed to send email via Resend');
          throw new Error(`Failed to send email: ${error.message}`);
        }

        logger.info(
          {
            to: options.to,
            subject: options.subject,
            emailId: data?.id,
          },
          '📧 Email sent via Resend'
        );
      } catch (error) {
        logger.error({ error, to: options.to }, 'Error sending email via Resend');
        throw error;
      }
      return;
    }

    throw new Error(`Unsupported email provider: ${env.EMAIL_PROVIDER}`);
  }
}

export const emailService = new EmailService();
