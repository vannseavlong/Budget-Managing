import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get all goals for the authenticated user
 */
export async function getGoals(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    // No user_id filter needed: actorSheetId already scopes this table to
    // exactly this user's own spreadsheet.
    const goals = await goalsTable.findMany({});

    res.status(200).json({
      success: true,
      data: goals,
      message: 'Goals retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
