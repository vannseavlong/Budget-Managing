import { Request, Response } from 'express';
import { getGoogleOAuthManager } from '../../services/auth/googleOAuth';
import { logger } from '../../utils/logger';

/** GET /api/v1/auth/google — starts the Google OAuth consent flow. */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const authUrl = getGoogleOAuthManager().getAuthUrl();
    res.status(200).json({
      success: true,
      authUrl,
      message: 'Please visit this URL to authorize the application',
    });
  } catch (error) {
    logger.error('Error initiating Google auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate authentication',
    });
  }
}
