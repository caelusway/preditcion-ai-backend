import { env } from '../config/env';
import { logger } from '../lib/logger';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Email template wrapper
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${env.APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ⚽ ${env.APP_NAME}
              </h1>
              <p style="margin: 8px 0 0; color: #a0aec0; font-size: 14px;">
                AI-Powered Match Predictions
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                      © ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      This email was sent to you because you signed up for ${env.APP_NAME}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

class EmailService {
  private getBaseUrl(): string {
    return env.APP_URL;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.getBaseUrl()}/auth/verify-email?token=${token}`;

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px; line-height: 80px;">✉️</span>
        </div>
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">
          Verify Your Email
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          Welcome to ${env.APP_NAME}! 🎉
        </p>
      </div>
      
      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        Thanks for signing up! Please verify your email address to get started with accurate AI-powered football predictions.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
          Verify Email Address
        </a>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 500;">
          Or copy and paste this link:
        </p>
        <p style="margin: 0; color: #3b82f6; font-size: 13px; word-break: break-all;">
          ${verificationUrl}
        </p>
      </div>
      
      <div style="border-left: 4px solid #f59e0b; padding-left: 16px; margin-top: 24px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⏰ This link will expire in <strong>24 hours</strong>
        </p>
      </div>
    `;

    await this.send({
      to: email,
      subject: `✉️ Verify your email - ${env.APP_NAME}`,
      text: `Welcome to ${env.APP_NAME}! Please verify your email by clicking: ${verificationUrl}. This link will expire in 24 hours.`,
      html: emailWrapper(content),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Deep link for mobile app
    const mobileDeepLink = `${env.APP_SCHEME}://reset-password?token=${token}`;
    // Web fallback URL
    const webResetUrl = `${this.getBaseUrl()}/reset-password?token=${token}`;

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px; line-height: 80px;">🔐</span>
        </div>
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">
          Reset Your Password
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          We received a password reset request
        </p>
      </div>
      
      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        Someone requested a password reset for your ${env.APP_NAME} account. If this was you, click the button below to set a new password.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${mobileDeepLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
          Reset Password in App
        </a>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${webResetUrl}" style="color: #6366f1; font-size: 14px; text-decoration: underline;">
          Or reset via browser
        </a>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; font-weight: 500;">
          If the button doesn't work, copy this link:
        </p>
        <p style="margin: 0; color: #3b82f6; font-size: 13px; word-break: break-all;">
          ${webResetUrl}
        </p>
      </div>
      
      <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: 600;">
          🔑 Your reset token:
        </p>
        <p style="margin: 0; color: #78350f; font-size: 14px; font-family: monospace; background-color: #fef9c3; padding: 8px 12px; border-radius: 6px; word-break: break-all;">
          ${token}
        </p>
      </div>
      
      <div style="border-left: 4px solid #ef4444; padding-left: 16px; margin-top: 24px;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;">
          ⏰ This link will expire in <strong>30 minutes</strong>
        </p>
      </div>
      
      <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px;">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `;

    await this.send({
      to: email,
      subject: `🔐 Password Reset - ${env.APP_NAME}`,
      text: `You requested a password reset for ${env.APP_NAME}. Click here to reset: ${webResetUrl}. Or use the app: ${mobileDeepLink}. Token: ${token}. This link will expire in 30 minutes.`,
      html: emailWrapper(content),
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const appUrl = this.getBaseUrl();

    const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px; line-height: 80px;">🎉</span>
        </div>
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">
          Welcome, ${name}!
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          Your email has been verified
        </p>
      </div>
      
      <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
        You're all set! Start exploring AI-powered football predictions and get insights on upcoming matches.
      </p>
      
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px; padding: 24px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 18px;">
          🚀 What you can do:
        </h3>
        <ul style="margin: 0; padding: 0 0 0 20px; color: #c7d2fe;">
          <li style="margin-bottom: 8px;">View AI predictions for upcoming matches</li>
          <li style="margin-bottom: 8px;">Track prediction accuracy over time</li>
          <li style="margin-bottom: 8px;">Save your favorite matches</li>
          <li style="margin-bottom: 0;">Get insights on team performance</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          Open App
        </a>
      </div>
    `;

    await this.send({
      to: email,
      subject: `🎉 Welcome to ${env.APP_NAME}!`,
      text: `Welcome to ${env.APP_NAME}, ${name}! Your email has been verified. Start exploring AI-powered football predictions at ${appUrl}`,
      html: emailWrapper(content),
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
