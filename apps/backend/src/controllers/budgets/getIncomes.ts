import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get all income entries for the authenticated user
 */
export async function getIncomes(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;

    const incomesTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_incomes'
    );

    // No user_id filter needed: actorSheetId already scopes this table to
    // exactly this user's own spreadsheet. Table creation is handled by
    // onSchemaMismatch: 'auto-sync' instead of an explicit ensure call.
    const incomes = await incomesTable.findMany({});

    res.status(200).json({ success: true, data: incomes });
  } catch (error) {
    logger.error('Error getting incomes:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
