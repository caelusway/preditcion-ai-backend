import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  tid: string; // tokenId
  iat: number;
  exp: number;
}

export function signAccessToken(userId: string, email: string): string {
  // @ts-ignore - expiresIn type mismatch with env variable
  return jwt.sign({ sub: userId, email }, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(userId: string, tokenId: string): string {
  // @ts-ignore - expiresIn type mismatch with env variable
  return jwt.sign({ sub: userId, tid: tokenId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET, {
    clockTolerance: 30, // 30 seconds clock skew tolerance
  }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    clockTolerance: 30,
  }) as RefreshTokenPayload;
}
