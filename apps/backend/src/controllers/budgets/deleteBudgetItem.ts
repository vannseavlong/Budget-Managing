import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if budget item exists and belongs to this user
    const existingBudgetItem = await googleSheetsService.findById(
      spreadsheetId,
      'budget_items',
      id
    );

    if (
      !existingBudgetItem ||
      existingBudgetItem.user_id !== authenticatedReq.user!.email
    ) {
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
