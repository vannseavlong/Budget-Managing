import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { DatabaseRecord } from '../../services/googleSheets/types';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get budget items for the authenticated user.
 * Optional query param: budget_id to filter by a specific budget.
 */
export async function getAllBudgetItems(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { budget_id } = req.query;

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );

    let budgetItems: DatabaseRecord[] = [];

    if (budget_id && typeof budget_id === 'string' && budget_id.trim()) {
      // If budget_id provided, verify the budget exists first (it's already
      // scoped to this user's own sheet)
      const budget = await budgetsTable.findOne({
        where: { id: budget_id },
      });
      if (!budget) {
        res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
        return;
      }

      budgetItems = await budgetItemsTable.findMany({
        where: { budget_id },
      });
    } else {
      // No budget_id: return items for all of this user's budgets
      const userBudgets: DatabaseRecord[] = await budgetsTable.findMany({});
      const budgetIds = new Set(
        userBudgets.map((b: DatabaseRecord) => String(b.id))
      );

      // Get all budget_items then filter in-memory by budget_id belonging to the user
      const allItems: DatabaseRecord[] = await budgetItemsTable.findMany({});
      budgetItems = allItems.filter((it: DatabaseRecord) =>
        budgetIds.has(String(it.budget_id))
      );
    }

    // Sort by category name if present
    budgetItems.sort((a: DatabaseRecord, b: DatabaseRecord) =>
      String(a.category_name || '').localeCompare(String(b.category_name || ''))
    );

    res.status(200).json({
      success: true,
      data: budgetItems,
      message: 'Budget items retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting all budget items:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
