import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  transactionSchema,
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function createTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const validatedData = transactionSchema.parse(req.body);
    const transactionData = {
      ...validatedData,
      user_id: userEmail,
    };

    const transactionId = await googleSheetsService.insert(
      spreadsheetId,
      'transactions',
      transactionData
    );

    // Update account balance
    const account = await googleSheetsService.findById(
      spreadsheetId,
      'accounts',
      validatedData.account_id
    );
    if (account) {
      const newBalance =
        validatedData.type === 'income'
          ? parseFloat(account.balance as string) + validatedData.amount
          : parseFloat(account.balance as string) - validatedData.amount;

      await googleSheetsService.update(
        spreadsheetId,
        'accounts',
        validatedData.account_id,
        {
          balance: newBalance,
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { id: transactionId, ...transactionData },
    });
  } catch (error) {
    logger.error('Error creating transaction:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create transaction',
    });
  }
}
