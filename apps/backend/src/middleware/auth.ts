import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    name: string;
    spreadsheetId: string;
    telegram_username?: string;
    chatId?: string;
    googleCredentials: any;
  };
}

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
    const jwtSecret =
      process.env.JWT_SECRET ||
      'development-secret-key-change-in-production-supersecurekey123456789';
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

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwtSecret =
        process.env.JWT_SECRET ||
        'development-secret-key-change-in-production-supersecurekey123456789';
      const decoded = jwt.verify(token, jwtSecret) as any;
      (req as AuthenticatedRequest).user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without authentication
      logger.warn('Optional auth failed:', error);
    }
  }

  next();
};
