import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { budgetId } = req.params;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // First verify the budget exists and belongs to this user
    const budget = await googleSheetsService.findById(
      spreadsheetId,
      'budgets',
      budgetId
    );

    // Debug log: show budget lookup result
    logger.info(
      `getBudgetItems: looked up budgetId=${budgetId} -> ${budget ? 'FOUND' : 'NOT_FOUND'}`
    );

    if (!budget || budget.user_id !== authenticatedReq.user!.email) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Get all budget items for this budget (filter by budget_id only).
    // budget_items sheet does not include user_id column, so don't filter by user_id.
    const budgetItems = await googleSheetsService.find(
      spreadsheetId,
      'budget_items',
      {
        budget_id: budgetId,
      }
    );

    // Debug log: number of items found
    logger.info(
      `getBudgetItems: budgetId=${budgetId} found ${budgetItems.length} budget_items`
    );

    // Sort by category name
    budgetItems.sort((a: any, b: any) =>
      a.category_name.localeCompare(b.category_name)
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
