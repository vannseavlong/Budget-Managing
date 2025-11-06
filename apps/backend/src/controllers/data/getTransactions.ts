import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function getTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const { account_id, category_id, limit } = req.query;
    const filters: any = { user_id: userEmail };

    if (account_id) filters.account_id = account_id;
    if (category_id) filters.category_id = category_id;

    let transactions = await googleSheetsService.find(
      spreadsheetId,
      'transactions',
      filters
    );

    // Sort by date (newest first)
    transactions.sort(
      (a, b) =>
        new Date(b.date as string).getTime() -
        new Date(a.date as string).getTime()
    );

    // Apply limit if specified
    if (limit && !isNaN(Number(limit))) {
      transactions = transactions.slice(0, Number(limit));
    }

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
    });
  }
}
