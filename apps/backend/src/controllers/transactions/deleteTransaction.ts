import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a transaction
 */
export async function deleteTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

    const transactionsTable = await getUserTable(
      email,
      spreadsheetId,
      'transactions'
    );

    // Check the transaction exists (it's already scoped to this user's own sheet)
    const existingTransaction = await transactionsTable.findOne({
      where: { id },
    });

    if (!existingTransaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    // Delete the transaction
    await transactionsTable.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
