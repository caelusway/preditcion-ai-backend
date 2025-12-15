import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { emailService } from './email.service';
import { AppError } from '../types/common.types';
import { logger } from '../lib/logger';

interface DeviceMetadata {
  device?: string;
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  async register(email: string, username: string, password: string, name: string, surname: string) {
    // Check if email exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(409, 'Email already exists');
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new AppError(409, 'Username already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name,
        surname,
      },
    });

    // Create email verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, token);

    logger.info({ userId: user.id, email: user.email, username: user.username }, 'User registered');

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async login(identifier: string, password: string, metadata: DeviceMetadata) {
    // Find user by email or username
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier }
        : { username: identifier },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AppError(403, 'Please verify your email before logging in');
    }

    // Create refresh token record
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt,
        device: metadata.device,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      },
    });

    // Generate tokens
    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, refreshTokenRecord.id);

    logger.info({ userId: user.id, email: user.email, username: user.username }, 'User logged in');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify JWT
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Check database record
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { id: payload.tid },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AppError(401, 'Refresh token not found');
    }

    if (tokenRecord.revoked) {
      throw new AppError(401, 'Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token has expired');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Create new refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        expiresAt,
        device: tokenRecord.device,
        ip: tokenRecord.ip,
        userAgent: tokenRecord.userAgent,
      },
    });

    // Generate new tokens
    const newAccessToken = signAccessToken(tokenRecord.user.id, tokenRecord.user.email);
    const newRefreshToken = signRefreshToken(tokenRecord.user.id, newRefreshTokenRecord.id);

    logger.info({ userId: tokenRecord.userId }, 'Token refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.update({
        where: { id: payload.tid },
        data: { revoked: true },
      });
      logger.info({ tokenId: payload.tid }, 'User logged out');
    } catch (error) {
      // Silent fail - token might not exist or be invalid
      logger.debug('Logout attempted with invalid token');
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user) {
      logger.debug({ email }, 'Password reset requested for non-existent email');
      return {
        message: 'If an account exists with that email, a reset code has been sent.',
      };
    }

    // Delete old password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token (6-digit numeric code)
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(email, token);

    logger.info({ userId: user.id }, 'Password reset code sent');

    return {
      message: 'If an account exists with that email, a reset code has been sent.',
    };
  }

  async verifyResetToken(token: string) {
    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new AppError(400, 'Invalid or expired reset code');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired reset code');
    }

    return {
      message: 'Reset code is valid',
      valid: true
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revoked: true },
    });

    // Delete used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    logger.info({ userId: resetToken.userId }, 'Password reset successfully');

    return { message: 'Password successfully reset' };
  }

  async verifyEmail(token: string) {
    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    // Update user
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    logger.info({ userId: verificationToken.userId }, 'Email verified');

    return { message: 'Email successfully verified' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        selectedTeam: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      emailVerified: user.emailVerified,
      selectedTeam: user.selectedTeam ? {
        id: user.selectedTeam.id,
        name: user.selectedTeam.name,
        logoUrl: user.selectedTeam.logoUrl,
        country: user.selectedTeam.country,
        league: user.selectedTeam.league,
      } : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success to prevent email enumeration
      return { message: 'If an account exists with that email, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      throw new AppError(400, 'Email is already verified');
    }

    // Check if a verification token was sent recently (rate limit: 2 minutes)
    const recentToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        },
      },
    });

    if (recentToken) {
      throw new AppError(429, 'Please wait before requesting another verification email');
    }

    // Delete old tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, token);

    logger.info({ userId: user.id, email }, 'Verification email resent');

    return { message: 'Verification email has been sent' };
  }

  async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Delete user (cascading deletes will handle related records)
    await prisma.user.delete({ where: { id: userId } });

    logger.info({ userId, email: user.email }, 'Account deleted');

    return { message: 'Account deleted successfully' };
  }

  async updateProfile(
    userId: string,
    data: { email?: string; name?: string; surname?: string }
  ) {
    // Check if email is being changed and if it's already taken
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppError(409, 'Email already exists');
      }

      // If email is being changed, set emailVerified to false
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          emailVerified: false,
        },
        include: {
          selectedTeam: true,
        },
      });

      // Create new email verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Delete old email verification tokens
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Send verification email to new email
      await emailService.sendVerificationEmail(data.email, token);

      logger.info({ userId, newEmail: data.email }, 'Profile updated with new email');

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        emailVerified: user.emailVerified,
        selectedTeam: user.selectedTeam ? {
          id: user.selectedTeam.id,
          name: user.selectedTeam.name,
          logoUrl: user.selectedTeam.logoUrl,
          country: user.selectedTeam.country,
          league: user.selectedTeam.league,
        } : null,
        createdAt: user.createdAt.toISOString(),
      };
    }

    // Update profile without email change
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        selectedTeam: true,
      },
    });

    logger.info({ userId }, 'Profile updated');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      emailVerified: user.emailVerified,
      selectedTeam: user.selectedTeam ? {
        id: user.selectedTeam.id,
        name: user.selectedTeam.name,
        logoUrl: user.selectedTeam.logoUrl,
        country: user.selectedTeam.country,
        league: user.selectedTeam.league,
      } : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async selectTeam(userId: string, teamId: string) {
    // Verify team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new AppError(404, 'Team not found');
    }

    // Update user's selected team
    const user = await prisma.user.update({
      where: { id: userId },
      data: { selectedTeamId: teamId },
      include: { selectedTeam: true },
    });

    logger.info({ userId, teamId }, 'User selected team');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      surname: user.surname,
      emailVerified: user.emailVerified,
      selectedTeam: user.selectedTeam ? {
        id: user.selectedTeam.id,
        name: user.selectedTeam.name,
        logoUrl: user.selectedTeam.logoUrl,
        country: user.selectedTeam.country,
        league: user.selectedTeam.league,
      } : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
