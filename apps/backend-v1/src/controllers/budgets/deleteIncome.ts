import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete an income entry
 */
export async function deleteIncome(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

    const incomesTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_incomes'
    );

    // Check the income exists (it's already scoped to this user's own sheet)
    const existing = await incomesTable.findOne({ where: { id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Income not found',
      });
      return;
    }

    await incomesTable.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Income deleted',
    });
  } catch (error) {
    logger.error('Error deleting income:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
