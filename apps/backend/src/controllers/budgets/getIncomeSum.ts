import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get sum of incomes for a given year/month for the authenticated user
 * Query params: year, month
 */
export async function getIncomeSum(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;

    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      res
        .status(400)
        .json({ success: false, message: 'year and month are required' });
      return;
    }

    const incomesTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_incomes'
    );

    const records = await incomesTable.findMany({ where: { year, month } });

    const total = records.reduce((sum, r) => {
      const a = parseFloat(String(r.amount || 0)) || 0;
      return sum + a;
    }, 0);

    res.json({ success: true, data: { total } });
  } catch (error) {
    logger.error('Error getting income sum:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
