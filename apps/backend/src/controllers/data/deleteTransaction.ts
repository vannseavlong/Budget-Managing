import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { setupUserCredentials, getUserSpreadsheetId } from './types';

const googleSheetsService = new GoogleSheetsService();

export async function deleteTransaction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const { id } = req.params;

    // Get transaction details before deletion for balance adjustment
    const transaction = await googleSheetsService.findById(
      spreadsheetId,
      'transactions',
      id
    );

    await googleSheetsService.delete(spreadsheetId, 'transactions', id);

    // Adjust account balance
    if (transaction) {
      const account = await googleSheetsService.findById(
        spreadsheetId,
        'accounts',
        transaction.account_id as string
      );
      if (account) {
        const adjustment =
          transaction.type === 'income'
            ? -parseFloat(transaction.amount as string)
            : parseFloat(transaction.amount as string);

        const newBalance = parseFloat(account.balance as string) + adjustment;

        await googleSheetsService.update(
          spreadsheetId,
          'accounts',
          transaction.account_id as string,
          {
            balance: newBalance,
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to delete transaction',
    });
  }
}
