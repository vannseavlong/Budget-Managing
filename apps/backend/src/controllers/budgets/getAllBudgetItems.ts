import { Request, Response } from 'express';
import { getAllBudgetItemsService } from '../../services/googleSheets/endpoints/budgets/getAllBudgetItemsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { budget_id } = req.query;

    const googleSheetsService = getAllBudgetItemsService;
    googleSheetsService.setCredentials(googleCredentials);

    let budgetItems: DatabaseRecord[] = [];

    if (budget_id && typeof budget_id === 'string' && budget_id.trim()) {
      // If budget_id provided, verify the budget belongs to the user first
      const budget = await googleSheetsService.findById(
        spreadsheetId,
        'budgets',
        budget_id
      );
      if (!budget || budget.user_id !== authenticatedReq.user!.email) {
        res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
        return;
      }

      // Fetch items for the given budget_id (don't filter by user_id; sheet doesn't store it)
      budgetItems = await googleSheetsService.find(
        spreadsheetId,
        'budget_items',
        {
          budget_id,
        }
      );
    } else {
      // No budget_id: return items for all budgets that belong to the authenticated user
      const userBudgets: DatabaseRecord[] = await googleSheetsService.find(
        spreadsheetId,
        'budgets',
        {
          user_id: authenticatedReq.user!.email,
        }
      );
      const budgetIds = new Set(
        userBudgets.map((b: DatabaseRecord) => String(b.id))
      );

      // Get all budget_items then filter in-memory by budget_id belonging to the user
      const allItems: DatabaseRecord[] = await googleSheetsService.find(
        spreadsheetId,
        'budget_items'
      );
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
