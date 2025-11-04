import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

/**
 * Logout user
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // In a real implementation, you'd invalidate the JWT token
    // For now, we'll just return a success message
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
