import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { listTransactionsQuerySchema } from './types';
import { toTransactionResponse, TransactionRecord } from './mapper';

/**
 * GET /api/v1/transactions — ported from backend-v1's getTransactions.ts.
 * `category_id` is exact-match so it's pushed into lsdb's `where`;
 * date_from/date_to are range filters, applied client-side after
 * findMany() since lsdb's `where` is exact-match only. No `user_id` filter
 * needed: actorSheetId already scopes this table to exactly this user's
 * own spreadsheet.
 */
export async function getTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { page, per_page, category_id, date_from, date_to } =
      listTransactionsQuerySchema.parse(req.query);

    const transactionsTable = await getUserTable(
      email,
      spreadsheetId,
      'transactions'
    );

    const filterCriteria: Record<string, unknown> = {};
    if (category_id) {
      filterCriteria.category_id = category_id;
    }

    let transactions = await transactionsTable.findMany({
      where: filterCriteria,
    });

    if (date_from || date_to) {
      transactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date as string);

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
      (a, b) =>
        new Date(b.date as string).getTime() -
        new Date(a.date as string).getTime()
    );

    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    const totalTransactions = transactions.length;
    const totalPages = Math.ceil(totalTransactions / per_page);

    res.status(200).json({
      success: true,
      data: paginatedTransactions.map((transaction) =>
        toTransactionResponse(transaction as TransactionRecord, email)
      ),
      pagination: {
        page,
        per_page,
        total: totalTransactions,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      message: 'Transactions retrieved successfully',
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

    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
}
