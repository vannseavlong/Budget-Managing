import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Validate user's database access
 */
export async function validateDatabase(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user || !user.googleCredentials || !user.spreadsheetId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated or database not found',
      });
      return;
    }

    const googleSheetsService = new GoogleSheetsService();

    // Set credentials and validate database
    googleSheetsService.setCredentials(user.googleCredentials);
    const isValid = await googleSheetsService.validateUserDatabase(
      user.spreadsheetId
    );

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Database validation failed. Please re-authenticate.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Database is accessible',
      spreadsheetId: user.spreadsheetId,
    });
  } catch (error) {
    logger.error('Error validating database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate database access',
    });
  }
}
