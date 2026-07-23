import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetResponse } from './mappers';
import { BudgetQueryParams } from './types';

/** GET /api/v1/budgets — optional ?year & ?month exact-match filters. */
export async function getBudgets(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { year, month } = req.query as unknown as BudgetQueryParams;

    const budgetsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budgets'
    );

    const where: Record<string, unknown> = {};
    if (year) where.year = Number(year);
    if (month) where.month = Number(month);

    const budgets = await budgetsTable.findMany({ where });

    budgets.sort((a: any, b: any) => {
      const yearDiff = Number(b.year) - Number(a.year);
      if (yearDiff !== 0) return yearDiff;
      return Number(b.month) - Number(a.month);
    });

    res.status(200).json({
      success: true,
      data: budgets.map((b: any) => toBudgetResponse(b, user.email)),
      message: 'Budgets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budgets',
    });
  }
}
