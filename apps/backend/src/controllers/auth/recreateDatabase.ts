import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Recreate database with updated schema
 */
export async function recreateDatabase(
  req: Request,
  res: Response
): Promise<void> {
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

    const googleSheetsService = new GoogleSheetsService();

    // Set the user's Google credentials
    googleSheetsService.setCredentials(user.googleCredentials);

    // Recreate the database with updated schema
    await googleSheetsService.recreateDatabase(user.spreadsheetId, user.email);

    res.status(200).json({
      success: true,
      message: 'Database schema updated successfully',
      spreadsheetId: user.spreadsheetId,
    });
  } catch (error) {
    logger.error('Error recreating database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recreate database',
    });
  }
}
