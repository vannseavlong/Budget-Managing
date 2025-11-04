import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  transactionSchema,
  setupUserCredentials,
  getUserSpreadsheetId,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function updateTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const { id } = req.params;

    const validatedData = transactionSchema.partial().parse(req.body);

    await googleSheetsService.update(
      spreadsheetId,
      'transactions',
      id,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    logger.error('Error updating transaction:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update transaction',
    });
  }
}
