import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { BudgetQueryParams } from './types';

/**
 * Get all budgets for the authenticated user
 */
export async function getBudgets(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { year, month } = req.query as any as BudgetQueryParams;

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');

    // No user_id filter needed: actorSheetId already scopes this table to
    // exactly this user's own spreadsheet.
    const filterCriteria: Record<string, unknown> = {};
    if (year) filterCriteria.year = Number(year);
    if (month) filterCriteria.month = Number(month);

    const budgets = await budgetsTable.findMany({ where: filterCriteria });

    // Sort by year and month (newest first)
    budgets.sort((a: any, b: any) => {
      const yearDiff = parseInt(b.year) - parseInt(a.year);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(b.month) - parseInt(a.month);
    });

    res.status(200).json({
      success: true,
      data: budgets,
      message: 'Budgets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
