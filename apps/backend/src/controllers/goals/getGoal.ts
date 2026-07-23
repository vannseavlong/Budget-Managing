import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toGoalResponse } from './types';

/** GET /api/v1/goals/:id — a single goal, scoped to the authenticated user's sheet. */
export async function getGoal(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');
    const goal = await goalsTable.findOne({ where: { _id: id } });

    if (!goal) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toGoalResponse(goal as any, email),
      message: 'Goal retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get goal',
    });
  }
}
