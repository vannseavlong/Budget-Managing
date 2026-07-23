import { Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from 'longcelot-sheet-db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { updateTransactionSchema } from './types';
import { toTransactionResponse, TransactionRecord } from './mapper';

/** PUT /api/v1/transactions/:id */
export async function updateTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validatedData = updateTransactionSchema.parse(req.body);

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

    // `category_id` is `.ref('categories._id')` on the schema, so lsdb
    // enforces the FK at write time (caught as ValidationError below) — no
    // need to defensively look the category up first.
    await transactionsTable.update({ where: { _id: id }, data: validatedData });

    const updatedTransaction = await transactionsTable.findOne({
      where: { _id: id },
    });

    res.status(200).json({
      success: true,
      data: toTransactionResponse(
        updatedTransaction as TransactionRecord,
        email
      ),
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof ValidationError && error.field === 'category_id') {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID or category does not belong to user',
      });
      return;
    }

    logger.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
    });
  }
}
