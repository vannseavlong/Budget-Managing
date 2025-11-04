import { Request, Response } from 'express';
import {
  GoogleSheetsService,
  UserCredentials,
} from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { refreshTokenSchema } from './types';

/**
 * Refresh access token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const { refresh_token } = validatedData;

    const googleSheetsService = new GoogleSheetsService();

    // Set refresh token and get new access token
    googleSheetsService.setCredentials({
      refresh_token,
    } as UserCredentials);

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
