import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toGoalResponse } from './types';

/**
 * GET /api/v1/goals — all goals for the authenticated user. No `user_id`
 * filter needed: actorSheetId already scopes this table to exactly this
 * user's own spreadsheet.
 */
export async function getGoals(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');
    const goals = await goalsTable.findMany({});

    res.status(200).json({
      success: true,
      data: goals.map((goal) => toGoalResponse(goal as any, email)),
      message: 'Goals retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get goals',
    });
  }
}
