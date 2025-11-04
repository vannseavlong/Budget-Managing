import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a budget
 */
export async function deleteBudget(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if budget exists and belongs to this user
    const existingBudget = await googleSheetsService.findById(
      spreadsheetId,
      'budgets',
      id
    );

    if (
      !existingBudget ||
      existingBudget.user_id !== authenticatedReq.user!.email
    ) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Delete all budget items associated with this budget first
    const budgetItems = await googleSheetsService.find(
      spreadsheetId,
      'budget_items',
      {
        user_id: authenticatedReq.user!.email,
        budget_id: id,
      }
    );

    // Delete all budget items
    for (const item of budgetItems) {
      await googleSheetsService.delete(spreadsheetId, 'budget_items', item.id);
    }

    // Delete the budget
    await googleSheetsService.delete(spreadsheetId, 'budgets', id);

    res.status(200).json({
      success: true,
      message: 'Budget and associated items deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
