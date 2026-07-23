import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/** DELETE /api/v1/budgets/incomes/:id */
export async function deleteIncome(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const incomesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_incomes'
    );

    const existing = await incomesTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Income not found',
      });
      return;
    }

    await incomesTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Income deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting income:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income',
    });
  }
}
