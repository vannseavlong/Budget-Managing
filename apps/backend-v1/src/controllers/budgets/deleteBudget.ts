import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a budget
 */
export async function deleteBudget(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');

    // Check the budget exists (it's already scoped to this user's own sheet)
    const existingBudget = await budgetsTable.findOne({ where: { id } });

    if (!existingBudget) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Delete all budget items associated with this budget first
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );
    const budgetItems = await budgetItemsTable.findMany({
      where: { budget_id: id },
    });

    for (const item of budgetItems) {
      await budgetItemsTable.delete({ where: { id: item.id as string } });
    }

    // Delete the budget
    await budgetsTable.delete({ where: { id } });

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
