import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { TransactionQueryParams } from './types';

/**
 * Get all transactions for the authenticated user
 */
export async function getTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    const {
      page = 1,
      per_page = 50,
      category_id,
      date_from,
      date_to,
    } = req.query as any as TransactionQueryParams;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Build filter criteria
    const filterCriteria: any = {
      user_id: authenticatedReq.user!.email,
    };

    if (category_id) {
      filterCriteria.category_id = category_id;
    }

    // Get all transactions for this user with filters
    let transactions = await googleSheetsService.find(
      spreadsheetId,
      'transactions',
      filterCriteria
    );

    // Apply date filters if provided
    if (date_from || date_to) {
      transactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);

        if (date_from && transactionDate < new Date(date_from)) {
          return false;
        }

        if (date_to && transactionDate > new Date(date_to)) {
          return false;
        }

        return true;
      });
    }

    // Sort by date (newest first)
    transactions.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Apply pagination
    const pageNum = Number(page);
    const perPage = Number(per_page);
    const startIndex = (pageNum - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalTransactions = transactions.length;
    const totalPages = Math.ceil(totalTransactions / perPage);

    res.status(200).json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page: pageNum,
        per_page: perPage,
        total: totalTransactions,
        total_pages: totalPages,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1,
      },
      message: 'Transactions retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
