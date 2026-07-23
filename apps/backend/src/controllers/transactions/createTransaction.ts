import { Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from 'longcelot-sheet-db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { createTransactionSchema } from './types';
import { toTransactionResponse, TransactionRecord } from './mapper';

/** POST /api/v1/transactions */
export async function createTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const validatedData = createTransactionSchema.parse(req.body);

    const transactionsTable = await getUserTable(
      email,
      spreadsheetId,
      'transactions'
    );

    // `category_id` is `.ref('categories._id')` on the schema, so lsdb
    // enforces the FK at write time (caught as ValidationError below) — no
    // need to defensively look the category up first.
    const created = await transactionsTable.create({
      name: validatedData.name,
      amount: validatedData.amount,
      category_id: validatedData.category_id,
      category_name: validatedData.category_name,
      date: validatedData.date,
      time: validatedData.time || '',
      notes: validatedData.notes || '',
      receipt_url: validatedData.receipt_url || '',
    });

    res.status(201).json({
      success: true,
      data: toTransactionResponse(created as TransactionRecord, email),
      message: 'Transaction created successfully',
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

    logger.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
    });
  }
}
