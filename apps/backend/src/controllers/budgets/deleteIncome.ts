import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete an income entry
 */
export async function deleteIncome(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;

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

    // Verify ownership before deleting
    const existing = await googleSheetsService.find(
      spreadsheetId,
      'budget_incomes',
      { id, user_id: authenticatedReq.user!.email }
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Income not found',
      });
      return;
    }

    await googleSheetsService.delete(spreadsheetId, 'budget_incomes', id);

    res.status(200).json({
      success: true,
      message: 'Income deleted',
    });
  } catch (error) {
    logger.error('Error deleting income:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
