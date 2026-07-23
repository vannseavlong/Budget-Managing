import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetIncomeResponse } from './mappers';

/** GET /api/v1/budgets/incomes — every income entry for this user. */
export async function getIncomes(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;

    const incomesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_incomes'
    );

    const incomes = await incomesTable.findMany({});

    res.status(200).json({
      success: true,
      data: incomes.map((r: any) => toBudgetIncomeResponse(r, user.email)),
      message: 'Incomes retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting incomes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get incomes',
    });
  }
}
