import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    if (!spreadsheetId) {
      res.status(400).json({
        success: false,
        message: 'Spreadsheet ID not found',
      });
      return;
    }

    if (!userEmail) {
      res.status(400).json({
        success: false,
        message: 'User email not found',
      });
      return;
    }

    logger.info(
      `Getting dashboard data for user: ${userEmail}, spreadsheet: ${spreadsheetId}`
    );

    // Get all user data with individual error handling
    let accounts: any[] = [];
    let transactions: any[] = [];
    let categories: any[] = [];
    let budgets: any[] = [];

    try {
      accounts = await googleSheetsService.find(spreadsheetId, 'accounts', {
        user_id: userEmail,
      });
      logger.info(`Found ${accounts.length} accounts`);
    } catch (error) {
      logger.error('Error fetching accounts:', error);
    }

    try {
      transactions = await googleSheetsService.find(
        spreadsheetId,
        'transactions',
        {
          user_id: userEmail,
        }
      );
      logger.info(`Found ${transactions.length} transactions`);
    } catch (error) {
      logger.error('Error fetching transactions:', error);
    }

    try {
      categories = await googleSheetsService.find(spreadsheetId, 'categories', {
        user_id: userEmail,
      });
      logger.info(`Found ${categories.length} categories`);
    } catch (error) {
      logger.error('Error fetching categories:', error);
    }

    try {
      budgets = await googleSheetsService.find(spreadsheetId, 'budgets', {
        user_id: userEmail,
      });
      logger.info(`Found ${budgets.length} budgets`);
    } catch (error) {
      logger.error('Error fetching budgets:', error);
    }

    // Calculate totals with safe parsing
    const totalBalance = accounts.reduce((sum, account) => {
      const balance = parseFloat(account.balance) || 0;
      return sum + balance;
    }, 0);

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyTransactions = transactions.filter((t) => {
      return t.date && t.date.startsWith(currentMonth);
    });

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Recent transactions (last 10) with safe date parsing
    const recentTransactions = transactions
      .filter((t) => t.date) // Only transactions with valid dates
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    const dashboardData = {
      summary: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netIncome: monthlyIncome - monthlyExpenses,
      },
      counts: {
        accounts: accounts.length,
        categories: categories.length,
        budgets: budgets.length,
        transactions: transactions.length,
      },
      recentTransactions,
    };

    logger.info('Dashboard data calculated successfully:', {
      totalBalance,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
    });

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
