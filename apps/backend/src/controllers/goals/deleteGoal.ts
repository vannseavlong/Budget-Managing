import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a goal
 */
export async function deleteGoal(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    // Check the goal exists (it's already scoped to this user's own sheet)
    const existingGoal = await goalsTable.findOne({ where: { id } });

    if (!existingGoal) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    // Delete the goal
    await goalsTable.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
