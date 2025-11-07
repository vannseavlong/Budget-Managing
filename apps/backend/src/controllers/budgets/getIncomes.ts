import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get all income entries for the authenticated user
 */
export async function getIncomes(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Ensure the incomes table exists
    await googleSheetsService.ensureTableExists(spreadsheetId, {
      name: 'budget_incomes',
      columns: [
        'id',
        'user_id',
        'year',
        'month',
        'amount',
        'source',
        'created_at',
        'updated_at',
      ],
    });

    const incomes = await googleSheetsService.find(
      spreadsheetId,
      'budget_incomes',
      { user_id: authenticatedReq.user!.email }
    );

    res.status(200).json({ success: true, data: incomes });
  } catch (error) {
    logger.error('Error getting incomes:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
