import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/** DELETE /api/v1/transactions/:id — transactions has softDelete: true, so this sets `_deleted_at`. */
export async function deleteTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const transactionsTable = await getUserTable(
      email,
      spreadsheetId,
      'transactions'
    );

    const existingTransaction = await transactionsTable.findOne({
      where: { _id: id },
    });

    if (!existingTransaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    await transactionsTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
    });
  }
}
