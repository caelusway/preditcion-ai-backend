import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  LogoutInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  UpdateProfileInput,
} from '../schemas/auth.schemas';

export class AuthController {
  async register(
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, name, surname } = req.body;
      const result = await authService.register(email, password, name, surname);
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
      const { email, password } = req.body;
      const metadata = {
        device: req.headers['x-device-name'] as string,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.login(email, password, metadata);
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
      const result = await authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
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
