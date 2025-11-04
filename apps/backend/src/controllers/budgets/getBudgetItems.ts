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

    if (!budget || budget.user_id !== authenticatedReq.user!.email) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Get all budget items for this budget
    const budgetItems = await googleSheetsService.find(
      spreadsheetId,
      'budget_items',
      {
        user_id: authenticatedReq.user!.email,
        budget_id: budgetId,
      }
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
