import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get user profile
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Fetch fresh user data from the database to include telegram fields
    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(user.googleCredentials);

    const users = await googleSheetsService.find(user.spreadsheetId, 'users', {
      email: user.email,
    });

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const currentUser = users[0];

    res.status(200).json({
      success: true,
      user: {
        email: currentUser.email,
        name: currentUser.name,
        telegram_username: currentUser.telegram_username || null,
        chatId: currentUser.chatId || null,
        spreadsheetId: user.spreadsheetId,
      },
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
}
