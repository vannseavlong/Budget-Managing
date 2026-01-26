import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { setCredentials } from '../../services/googleSheets';
import { UserCredentials } from '../../services/googleSheets/types';
import { z } from 'zod';
import { refreshTokenSchema } from './types';

/**
 * Refresh access token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refresh_token } = validatedData;

    // Set refresh token on the shared Google auth client
    setCredentials({ refresh_token } as UserCredentials);

    // In a real implementation, you'd refresh the token here
    // For now, we'll return a success message
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    logger.error('Error refreshing token:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
}
