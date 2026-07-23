import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/**
 * DELETE /api/v1/budgets/:id — also deletes every budget_item that
 * references this budget (budget_items has no soft-delete / cascade of its
 * own, so this is done explicitly, same as backend-v1).
 */
export async function deleteBudget(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const budgetsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budgets'
    );

    const existing = await budgetsTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    const budgetItemsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_items'
    );
    const items = await budgetItemsTable.findMany({ where: { budget_id: id } });

    for (const item of items) {
      await budgetItemsTable.delete({ where: { _id: item._id as string } });
    }

    await budgetsTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Budget and associated items deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
    });
  }
}
