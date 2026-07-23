import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetItemResponse } from './mappers';

/**
 * GET /api/v1/budgets/items — optional ?budget_id= exact-match filter (see
 * apps/frontend/lib/budgets-service.ts's getBudgetItems, which always calls
 * this endpoint with budget_id set rather than a nested /:budgetId/items
 * route). With no budget_id, every budget item across this user's budgets
 * is returned.
 */
export async function getBudgetItems(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { budget_id: budgetId } = req.query;

    const budgetItemsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_items'
    );

    let items: Record<string, unknown>[];

    if (typeof budgetId === 'string' && budgetId.trim()) {
      const budgetsTable = await getUserTable(
        user.email,
        user.spreadsheetId,
        'budgets'
      );
      const budget = await budgetsTable.findOne({ where: { _id: budgetId } });

      if (!budget) {
        res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
        return;
      }

      items = await budgetItemsTable.findMany({
        where: { budget_id: budgetId },
      });
    } else {
      items = await budgetItemsTable.findMany({});
    }

    items.sort((a: any, b: any) =>
      String(a.category_name || '').localeCompare(String(b.category_name || ''))
    );

    res.status(200).json({
      success: true,
      data: items.map((item: any) => toBudgetItemResponse(item, user.email)),
      message: 'Budget items retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting budget items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budget items',
    });
  }
}
