import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';

/**
 * Initiate Google OAuth flow
 */
export async function initiateAuth(req: Request, res: Response): Promise<void> {
  try {
    const googleSheetsService = new GoogleSheetsService();
    const authUrl = googleSheetsService.getAuthUrl();

    res.status(200).json({
      success: true,
      authUrl,
      message: 'Please visit this URL to authorize the application',
    });
  } catch (error) {
    logger.error('Error initiating auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate authentication',
    });
  }
}
