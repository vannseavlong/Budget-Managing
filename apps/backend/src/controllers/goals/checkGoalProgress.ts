import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { GoalPeriod } from './types';

/**
 * Check goal progress
 */
export async function checkGoalProgress(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if goal exists and belongs to this user
    const goal = await googleSheetsService.findById(spreadsheetId, 'goals', id);

    if (!goal || goal.user_id !== authenticatedReq.user!.email) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (goal.period as GoalPeriod) {
      case 'daily':
        periodStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear() + 1, 0, 1);
        break;
    }

    // Get transactions in this period
    const transactions = await googleSheetsService.find(
      spreadsheetId,
      'transactions',
      { user_id: authenticatedReq.user!.email }
    );

    // Filter transactions by period and calculate total amount
    const periodTransactions = transactions.filter((transaction: any) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= periodStart && transactionDate < periodEnd;
    });

    const currentAmount = periodTransactions.reduce(
      (total: number, transaction: any) => {
        return total + parseFloat(transaction.amount || 0);
      },
      0
    );

    const limitAmount = parseFloat(goal.limit_amount as string);
    const remainingAmount = limitAmount - currentAmount;
    const percentageUsed = (currentAmount / limitAmount) * 100;
    const isExceeded = currentAmount > limitAmount;

    res.status(200).json({
      success: true,
      data: {
        goal: goal,
        current_amount: currentAmount,
        remaining_amount: remainingAmount,
        percentage_used: Math.round(percentageUsed * 100) / 100,
        is_exceeded: isExceeded,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      },
      message: 'Goal progress retrieved successfully',
    });
  } catch (error) {
    logger.error('Error checking goal progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
