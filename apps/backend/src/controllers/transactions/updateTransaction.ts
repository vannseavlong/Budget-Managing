import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateTransactionSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if transaction exists and belongs to this user
    const existingTransaction = await googleSheetsService.findById(
      spreadsheetId,
      'transactions',
      id
    );

    if (
      !existingTransaction ||
      existingTransaction.user_id !== authenticatedReq.user!.email
    ) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    // If category_id is being updated, verify the new category exists and belongs to this user
    if (
      validatedData.category_id &&
      validatedData.category_id !== existingTransaction.category_id
    ) {
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
    }

    // Update the transaction
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await googleSheetsService.update(
      spreadsheetId,
      'transactions',
      id,
      updateData
    );

    // Get updated transaction
    const updatedTransaction = await googleSheetsService.findById(
      spreadsheetId,
      'transactions',
      id
    );

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
