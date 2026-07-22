import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get all budget items for a specific budget
 */
export async function getBudgetItems(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { budgetId } = req.params;

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');

    // First verify the budget exists (it's already scoped to this user's own sheet)
    const budget = await budgetsTable.findOne({ where: { id: budgetId } });

    // Debug log: show budget lookup result
    logger.info(
      `getBudgetItems: looked up budgetId=${budgetId} -> ${budget ? 'FOUND' : 'NOT_FOUND'}`
    );

    if (!budget) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Get all budget items for this budget (filter by budget_id only).
    // budget_items sheet does not include a user_id column.
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );
    const budgetItems = await budgetItemsTable.findMany({
      where: { budget_id: budgetId },
    });

    // Debug log: number of items found
    logger.info(
      `getBudgetItems: budgetId=${budgetId} found ${budgetItems.length} budget_items`
    );

    // Sort by category name
    budgetItems.sort((a: any, b: any) =>
      String(a.category_name || '').localeCompare(String(b.category_name || ''))
    );

    res.status(200).json({
      success: true,
      data: budgetItems,
      message: 'Budget items retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting budget items:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
