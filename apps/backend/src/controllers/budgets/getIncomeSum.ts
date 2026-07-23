import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/**
 * GET /api/v1/budgets/incomes/sum?year&month
 *
 * lsdb's `where` is exact-match only, so both year and month are required
 * to build the filter — the sum itself is computed in application code
 * after findMany(), same as backend-v1.
 */
export async function getIncomeSum(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      res.status(400).json({
        success: false,
        message: 'year and month are required',
      });
      return;
    }

    const incomesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_incomes'
    );

    const records = await incomesTable.findMany({ where: { year, month } });

    const total = records.reduce((sum: number, r: any) => {
      const amount = parseFloat(String(r.amount ?? 0)) || 0;
      return sum + amount;
    }, 0);

    res.status(200).json({
      success: true,
      data: { total },
    });
  } catch (error) {
    logger.error('Error getting income sum:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get income sum',
    });
  }
}
