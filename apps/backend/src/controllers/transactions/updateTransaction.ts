import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';
import { updateTransactionSchema } from './types';

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateTransactionSchema.parse(req.body);

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

    // If category_id is being updated, verify the new category exists
    if (
      validatedData.category_id &&
      validatedData.category_id !== existingTransaction.category_id
    ) {
      const categoriesTable = await getUserTable(
        email,
        spreadsheetId,
        'categories'
      );
      const category = await categoriesTable.findOne({
        where: { id: validatedData.category_id },
      });

      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID or category does not belong to user',
        });
        return;
      }
    }

    // Update the transaction
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await transactionsTable.update({ where: { id }, data: updateData });

    // Get updated transaction
    const updatedTransaction = await transactionsTable.findOne({
      where: { id },
    });

    res.status(200).json({
      success: true,
      data: updatedTransaction,
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

    logger.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
