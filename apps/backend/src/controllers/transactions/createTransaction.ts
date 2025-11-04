import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createTransactionSchema } from './types';

/**
 * Create a new transaction
 */
export async function createTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validatedData = createTransactionSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Verify that the category exists and belongs to this user
    const category = await googleSheetsService.findById(
      spreadsheetId,
      'categories',
      validatedData.category_id
    );

    if (!category || category.user_id !== authenticatedReq.user!.email) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID or category does not belong to user',
      });
      return;
    }

    // Create new transaction
    const newTransaction = {
      id: uuidv4(),
      name: validatedData.name,
      amount: validatedData.amount,
      category_id: validatedData.category_id,
      category_name: validatedData.category_name,
      date: validatedData.date,
      time: validatedData.time || '',
      notes: validatedData.notes || '',
      receipt_url: validatedData.receipt_url || '',
      user_id: authenticatedReq.user!.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into Google Sheets
    await googleSheetsService.insert(
      spreadsheetId,
      'transactions',
      newTransaction
    );

    res.status(201).json({
      success: true,
      data: newTransaction,
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

    logger.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
