import { Request, Response } from 'express';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas for different entities
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  type: z.enum(['income', 'expense'], {
    required_error: 'Type must be income or expense',
  }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
});

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: z.enum(['checking', 'savings', 'credit', 'cash', 'investment'], {
    required_error: 'Invalid account type',
  }),
  balance: z.number().default(0),
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .default('USD'),
});

const transactionSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  category_id: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  type: z.enum(['income', 'expense'], {
    required_error: 'Type must be income or expense',
  }),
  date: z.string().datetime('Invalid date format'),
});

const budgetSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Invalid period',
  }),
  start_date: z.string().datetime('Invalid start date'),
  end_date: z.string().datetime('Invalid end date'),
});

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z
    .number()
    .min(0, 'Current amount cannot be negative')
    .default(0),
  target_date: z.string().datetime('Invalid target date'),
});

export class DataController {
  private googleSheetsService: GoogleSheetsService;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
  }

  private setupUserCredentials(req: Request): void {
    const user = (req as any).user;
    if (user?.googleCredentials) {
      this.googleSheetsService.setCredentials(user.googleCredentials);
    }
  }

  private getUserSpreadsheetId(req: Request): string {
    const user = (req as any).user;
    return user?.spreadsheetId;
  }

  // Categories CRUD operations
  createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const validatedData = categorySchema.parse(req.body);
      const categoryData = {
        ...validatedData,
        user_id: user.email, // Using email as user identifier
        color: validatedData.color || '#3B82F6',
      };

      const categoryId = await this.googleSheetsService.insert(
        spreadsheetId,
        'categories',
        categoryData
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { id: categoryId, ...categoryData },
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create category',
      });
    }
  };

  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const categories = await this.googleSheetsService.find(
        spreadsheetId,
        'categories',
        {
          user_id: user.email,
        }
      );

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
      });
    }
  };

  updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      const validatedData = categorySchema.partial().parse(req.body);

      await this.googleSheetsService.update(
        spreadsheetId,
        'categories',
        id,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update category',
      });
    }
  };

  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      await this.googleSheetsService.delete(spreadsheetId, 'categories', id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete category',
      });
    }
  };

  // Accounts CRUD operations
  createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const validatedData = accountSchema.parse(req.body);
      const accountData = {
        ...validatedData,
        user_id: user.email,
      };

      const accountId = await this.googleSheetsService.insert(
        spreadsheetId,
        'accounts',
        accountData
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: { id: accountId, ...accountData },
      });
    } catch (error) {
      logger.error('Error creating account:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create account',
      });
    }
  };

  getAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const accounts = await this.googleSheetsService.find(
        spreadsheetId,
        'accounts',
        {
          user_id: user.email,
        }
      );

      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      logger.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get accounts',
      });
    }
  };

  updateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      const validatedData = accountSchema.partial().parse(req.body);

      await this.googleSheetsService.update(
        spreadsheetId,
        'accounts',
        id,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: 'Account updated successfully',
      });
    } catch (error) {
      logger.error('Error updating account:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update account',
      });
    }
  };

  deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      await this.googleSheetsService.delete(spreadsheetId, 'accounts', id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting account:', error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete account',
      });
    }
  };

  // Transactions CRUD operations
  createTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const validatedData = transactionSchema.parse(req.body);
      const transactionData = {
        ...validatedData,
        user_id: user.email,
      };

      const transactionId = await this.googleSheetsService.insert(
        spreadsheetId,
        'transactions',
        transactionData
      );

      // Update account balance
      const account = await this.googleSheetsService.findById(
        spreadsheetId,
        'accounts',
        validatedData.account_id
      );
      if (account) {
        const newBalance =
          validatedData.type === 'income'
            ? parseFloat(account.balance as string) + validatedData.amount
            : parseFloat(account.balance as string) - validatedData.amount;

        await this.googleSheetsService.update(
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
          error instanceof Error
            ? error.message
            : 'Failed to create transaction',
      });
    }
  };

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      const { account_id, category_id, limit } = req.query;
      const filters: any = { user_id: user.email };

      if (account_id) filters.account_id = account_id;
      if (category_id) filters.category_id = category_id;

      let transactions = await this.googleSheetsService.find(
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
  };

  updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      const validatedData = transactionSchema.partial().parse(req.body);

      await this.googleSheetsService.update(
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
          error instanceof Error
            ? error.message
            : 'Failed to update transaction',
      });
    }
  };

  deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const { id } = req.params;

      // Get transaction details before deletion for balance adjustment
      const transaction = await this.googleSheetsService.findById(
        spreadsheetId,
        'transactions',
        id
      );

      await this.googleSheetsService.delete(spreadsheetId, 'transactions', id);

      // Adjust account balance
      if (transaction) {
        const account = await this.googleSheetsService.findById(
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

          await this.googleSheetsService.update(
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
          error instanceof Error
            ? error.message
            : 'Failed to delete transaction',
      });
    }
  };

  // Dashboard/Analytics endpoints
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      this.setupUserCredentials(req);
      const spreadsheetId = this.getUserSpreadsheetId(req);
      const user = (req as any).user;

      // Get all user data
      const [accounts, transactions, categories, budgets] = await Promise.all([
        this.googleSheetsService.find(spreadsheetId, 'accounts', {
          user_id: user.email,
        }),
        this.googleSheetsService.find(spreadsheetId, 'transactions', {
          user_id: user.email,
        }),
        this.googleSheetsService.find(spreadsheetId, 'categories', {
          user_id: user.email,
        }),
        this.googleSheetsService.find(spreadsheetId, 'budgets', {
          user_id: user.email,
        }),
      ]);

      // Calculate totals
      const totalBalance = accounts.reduce(
        (sum, account) => sum + parseFloat((account.balance as string) || '0'),
        0
      );

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyTransactions = transactions.filter((t) =>
        (t.date as string).startsWith(currentMonth)
      );

      const monthlyIncome = monthlyTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

      const monthlyExpenses = monthlyTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

      // Recent transactions (last 10)
      const recentTransactions = transactions
        .sort(
          (a, b) =>
            new Date(b.date as string).getTime() -
            new Date(a.date as string).getTime()
        )
        .slice(0, 10);

      res.status(200).json({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      logger.error('Error getting dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
      });
    }
  };
}
