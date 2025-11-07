import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get sum of incomes for a given year/month for the authenticated user
 * Query params: year, month
 */
export async function getIncomeSum(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      res
        .status(400)
        .json({ success: false, message: 'year and month are required' });
      return;
    }

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // find incomes for this user and month/year
    // Ensure the incomes table exists (creates headers if missing)
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

    const records = await googleSheetsService.find(
      spreadsheetId,
      'budget_incomes',
      {
        user_id: authenticatedReq.user!.email,
        year: String(year),
        month: String(month),
      }
    );

    const total = records.reduce((sum, r) => {
      const a = parseFloat(String(r.amount || 0)) || 0;
      return sum + a;
    }, 0);

    res.json({ success: true, data: { total } });
  } catch (error) {
    logger.error('Error getting income sum:', error);
    res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Internal server error',
      });
  }
}
