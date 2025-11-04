import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Get transaction statistics
 */
export async function getTransactionStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { period = 'month', year, month } = req.query;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Get all transactions for this user
    const transactions = await googleSheetsService.find(
      spreadsheetId,
      'transactions',
      { user_id: authenticatedReq.user!.email }
    );

    // Filter transactions based on period
    let filteredTransactions = transactions;
    const currentDate = new Date();
    const currentYear = year
      ? parseInt(year as string)
      : currentDate.getFullYear();
    const currentMonth = month
      ? parseInt(month as string)
      : currentDate.getMonth() + 1;

    if (period && period !== 'all') {
      filteredTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
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

    // Calculate statistics
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = filteredTransactions.length;

    filteredTransactions.forEach((transaction: any) => {
      const amount = parseFloat(transaction.amount);
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
        period: period,
        year: currentYear,
        month: currentMonth,
      },
      message: 'Transaction statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting transaction stats:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
