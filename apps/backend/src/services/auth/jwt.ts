import jwt, { type SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET_FALLBACK =
  'development-secret-key-change-in-production-supersecurekey123456789';
const REFRESH_SECRET_FALLBACK =
  'd8df0a64f19a35a640a816dd1ab883cb369e3a1709c2d1207385dde6d6efe818f3357d32ba25d140eecebb5a909fd059332fe361ad5be27d69e165e3a34a900c';

function accessSecret(): string {
  return process.env.JWT_SECRET || ACCESS_SECRET_FALLBACK;
}

function refreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || REFRESH_SECRET_FALLBACK;
}

export interface AccessTokenPayload {
  email: string;
  name: string;
  spreadsheetId: string;
  role: 'admin' | 'user';
}

export interface RefreshTokenPayload {
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, accessSecret(), options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
      '30d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, refreshSecret(), options);
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, accessSecret()) as AccessTokenPayload & {
    iat: number;
    exp: number;
  };
}

export function verifyRefreshToken(
  token: string
): RefreshTokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, refreshSecret()) as RefreshTokenPayload & {
    iat: number;
    exp: number;
  };
}
