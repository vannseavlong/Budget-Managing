import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

/** POST /api/v1/auth/logout — no token blacklist, matches backend-v1. */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
}
