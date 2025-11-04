import { Request } from 'express';
import { z } from 'zod';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';

// Validation schemas for different entities
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  type: z.enum(['income', 'expense'], {
    required_error: 'Type must be income or expense',
  }),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
});

export const accountSchema = z.object({
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

export const transactionSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  category_id: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  type: z.enum(['income', 'expense'], {
    required_error: 'Type must be income or expense',
  }),
  date: z.string().datetime('Invalid date format'),
});

export const budgetSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Invalid period',
  }),
  start_date: z.string().datetime('Invalid start date'),
  end_date: z.string().datetime('Invalid end date'),
});

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z
    .number()
    .min(0, 'Current amount cannot be negative')
    .default(0),
  target_date: z.string().datetime('Invalid target date'),
});

// Type definitions
export type CategoryData = z.infer<typeof categorySchema>;
export type AccountData = z.infer<typeof accountSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
export type BudgetData = z.infer<typeof budgetSchema>;
export type GoalData = z.infer<typeof goalSchema>;

// Shared utility functions
export function setupUserCredentials(
  req: Request,
  googleSheetsService: GoogleSheetsService
): void {
  const user = (req as any).user;
  if (user?.googleCredentials) {
    googleSheetsService.setCredentials(user.googleCredentials);
  }
}

export function getUserSpreadsheetId(req: Request): string {
  const user = (req as any).user;
  return user?.spreadsheetId;
}

export function getUserEmail(req: Request): string {
  const user = (req as any).user;
  return user?.email;
}
