import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  LogoutInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  UpdateProfileInput,
  ResendVerificationInput,
} from '../schemas/auth.schemas';

// HTML page that redirects to mobile app
const getMobileRedirectPage = (success: boolean, message: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Email Verified!' : 'Verification Failed'} - ${env.APP_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 48px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 40px;
    }
    .icon.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .icon.error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    h1 { color: #1e293b; font-size: 28px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      padding: 16px 48px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
    }
    .btn.secondary {
      background: #f1f5f9;
      color: #475569;
      margin-top: 12px;
      display: block;
    }
    .footer { margin-top: 32px; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${success ? 'success' : 'error'}">
      ${success ? '✓' : '✕'}
    </div>
    <h1>${success ? 'Email Verified!' : 'Verification Failed'}</h1>
    <p>${message}</p>
    <a href="${env.APP_SCHEME}://email-verified?success=${success}" class="btn">
      Open App
    </a>
    <a href="${env.APP_URL}" class="btn secondary">
      Continue in Browser
    </a>
    <p class="footer">
      If the app doesn't open automatically,<br>
      please open ${env.APP_NAME} manually.
    </p>
  </div>
  <script>
    // Try to open the app automatically after a short delay
    setTimeout(function() {
      window.location.href = "${env.APP_SCHEME}://email-verified?success=${success}";
    }, 1000);
  </script>
</body>
</html>
`;

export class AuthController {
  async register(
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, username, password, name, surname } = req.body;
      const result = await authService.register(email, username, password, name, surname);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { identifier, password } = req.body;
      const metadata = {
        device: req.headers['x-device-name'] as string,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.login(identifier, password, metadata);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(
    req: Request<{}, {}, ResendVerificationInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerification(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.deleteAccount(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async selectTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { teamId } = req.body;
      const result = await authService.selectTeam(userId, teamId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request<{}, {}, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(
    req: Request<{}, {}, LogoutInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request<{}, {}, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyResetToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.body;
      const result = await authService.verifyResetToken(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request<{}, {}, ResetPasswordInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(
    req: Request<{}, {}, {}, VerifyEmailInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { token } = req.query;
      const redirect = req.query.redirect as string;

      // Verify the email
      await authService.verifyEmail(token);

      // If redirect=false or API call, return JSON
      if (redirect === 'false' || req.headers.accept?.includes('application/json')) {
        return res.status(200).json({ 
          success: true,
          message: 'Email successfully verified' 
        });
      }

      // Otherwise, show HTML page with mobile app redirect
      res.setHeader('Content-Type', 'text/html');
      res.send(getMobileRedirectPage(
        true,
        'Your email has been verified successfully! You can now use all features of the app.'
      ));
    } catch (error: any) {
      // If API call, pass to error handler
      if (req.headers.accept?.includes('application/json')) {
        return next(error);
      }

      // Show error HTML page
      res.setHeader('Content-Type', 'text/html');
      res.send(getMobileRedirectPage(
        false,
        error.message || 'The verification link is invalid or has expired. Please request a new verification email.'
      ));
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await authService.getProfile(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request<{}, {}, UpdateProfileInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const result = await authService.updateProfile(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
