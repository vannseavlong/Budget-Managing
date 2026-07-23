import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/**
 * DELETE /api/v1/goals/:id — `goals` has `softDelete: true`, so this sets
 * `_deleted_at` rather than removing the row (handled by lsdb internally).
 */
export async function deleteGoal(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    const existingGoal = await goalsTable.findOne({ where: { _id: id } });

    if (!existingGoal) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    await goalsTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
    });
  }
}
