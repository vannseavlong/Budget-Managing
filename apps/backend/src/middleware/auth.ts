import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// No `googleCredentials` on this payload — the app JWT never carries Google
// tokens (they live server-side only, see services/auth/tokenStore.ts).
export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    spreadsheetId: string;
    role: 'admin' | 'user';
  };
}

const JWT_SECRET_FALLBACK =
  'development-secret-key-change-in-production-supersecurekey123456789';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
    });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || JWT_SECRET_FALLBACK;
    const decoded = jwt.verify(token, jwtSecret) as any;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
    });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }

  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || JWT_SECRET_FALLBACK;
      const decoded = jwt.verify(token, jwtSecret) as any;
      (req as AuthenticatedRequest).user = decoded;
    } catch (error) {
      logger.warn('Optional auth failed:', error);
    }
  }

  next();
};
