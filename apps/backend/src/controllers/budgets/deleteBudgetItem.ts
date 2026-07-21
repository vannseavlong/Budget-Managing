import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
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
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

    // Optimization (unchanged from before this migration): we skip budget
    // ownership validation — the spreadsheet is already user-specific.
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );
    const existingBudgetItem = await budgetItemsTable.findOne({
      where: { id },
    });

    if (!existingBudgetItem) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    // Delete the budget item
    await budgetItemsTable.delete({ where: { id } });

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
