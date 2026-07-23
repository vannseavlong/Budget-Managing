import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/** DELETE /api/v1/budgets/items/:id */
export async function deleteBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const budgetItemsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_items'
    );

    const existing = await budgetItemsTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    await budgetItemsTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Budget item deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting budget item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget item',
    });
  }
}
