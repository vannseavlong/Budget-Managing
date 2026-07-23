import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { transactionStatsQuerySchema } from './types';

/**
 * GET /api/v1/transactions/summary — ported from backend-v1's
 * getTransactionStats.ts (there named /stats; apps/frontend's
 * API_ENDPOINTS.TRANSACTIONS.SUMMARY expects `/transactions/summary`, so
 * that's the path mounted here — same aggregation logic, same response
 * shape otherwise).
 */
export async function getTransactionSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { period, year, month } = transactionStatsQuerySchema.parse(
      req.query
    );

    const transactionsTable = await getUserTable(
      email,
      spreadsheetId,
      'transactions'
    );
    const transactions = await transactionsTable.findMany({});

    let filteredTransactions = transactions;
    const currentDate = new Date();
    const currentYear = year ?? currentDate.getFullYear();
    const currentMonth = month ?? currentDate.getMonth() + 1;

    if (period !== 'all') {
      filteredTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date as string);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = transactionDate.getMonth() + 1;
        const transactionDay = transactionDate.getDate();
        const transactionWeek = Math.ceil(transactionDay / 7);

        switch (period) {
          case 'day':
            return (
              transactionYear === currentYear &&
              transactionMonth === currentMonth &&
              transactionDay === currentDate.getDate()
            );
          case 'week':
            return (
              transactionYear === currentYear &&
              transactionMonth === currentMonth &&
              transactionWeek === Math.ceil(currentDate.getDate() / 7)
            );
          case 'month':
            return (
              transactionYear === currentYear &&
              transactionMonth === currentMonth
            );
          case 'year':
            return transactionYear === currentYear;
          default:
            return true;
        }
      });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const transactionCount = filteredTransactions.length;

    filteredTransactions.forEach((transaction) => {
      const amount = parseFloat(String(transaction.amount));
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    });

    const netIncome = totalIncome - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: netIncome,
        transaction_count: transactionCount,
        period,
        year: currentYear,
        month: currentMonth,
      },
      message: 'Transaction statistics retrieved successfully',
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

    logger.error('Error getting transaction summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction summary',
    });
  }
}
