import { Request, Response } from 'express';
import { deleteBudgetItemService } from '../../services/googleSheets/endpoints/budgets/deleteBudgetItemService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a budget item
 */
export async function deleteBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;

    const googleSheetsService = deleteBudgetItemService;
    googleSheetsService.setCredentials(googleCredentials);

    // Optimization: We skip budget ownership validation to reduce API quota usage
    // The spreadsheet is already user-specific (from auth token), so budget items
    // in this spreadsheet inherently belong to this user
    const existingBudgetItem = await googleSheetsService.findById(
      spreadsheetId,
      'budget_items',
      id
    );

    if (!existingBudgetItem) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    // Delete the budget item
    await googleSheetsService.delete(spreadsheetId, 'budget_items', id);

    res.status(200).json({
      success: true,
      message: 'Budget item deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting budget item:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
