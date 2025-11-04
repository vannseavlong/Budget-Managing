import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get all goals for the authenticated user
 */
export async function getGoals(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Get all goals for this user
    const goals = await googleSheetsService.find(
      spreadsheetId,
      'goals',
      { user_id: authenticatedReq.user!.email } // Filter by user
    );

    res.status(200).json({
      success: true,
      data: goals,
      message: 'Goals retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
