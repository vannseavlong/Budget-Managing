import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toTransactionResponse, TransactionRecord } from './mapper';

/** GET /api/v1/transactions/:id */
export async function getTransaction(
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
    const transaction = await transactionsTable.findOne({ where: { _id: id } });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toTransactionResponse(transaction as TransactionRecord, email),
      message: 'Transaction retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
    });
  }
}
