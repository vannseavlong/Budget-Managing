import { z } from 'zod';

// Validation schemas — ported from backend-v1's controllers/transactions/types.ts.
export const createTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required'),
  amount: z.number().positive('Amount must be positive'),
  category_id: z.string().min(1, 'Category ID is required'),
  category_name: z.string().min(1, 'Category name is required'),
  date: z.string().datetime('Invalid date format'),
  time: z.string().optional(),
  notes: z.string().optional(),
  receipt_url: z.string().url('Invalid URL format').optional(),
});

export const updateTransactionSchema = z.object({
  name: z.string().min(1, 'Transaction name is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  category_id: z.string().min(1, 'Category ID is required').optional(),
  category_name: z.string().min(1, 'Category name is required').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  receipt_url: z.string().url('Invalid URL format').optional(),
});

// lsdb's `where` is exact-match only, so category_id is the only filter
// applied at the findMany() level; date_from/date_to are applied afterward
// in application code, same as backend-v1's getTransactions.ts.
export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  per_page: z.coerce.number().int().positive().max(500).optional().default(50),
  category_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export const transactionStatsQuerySchema = z.object({
  period: z
    .enum(['day', 'week', 'month', 'year', 'all'])
    .optional()
    .default('month'),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type CreateTransactionRequest = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type TransactionStatsQuery = z.infer<typeof transactionStatsQuerySchema>;

/** Matches backend-v1's original snake_case shape (see task's response-shape contract). */
export interface TransactionResponse {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  category_name?: string;
  date: string;
  time?: string;
  notes?: string;
  receipt_url?: string;
  user_id: string;
  created_at: string | undefined;
  updated_at: string | undefined;
}
