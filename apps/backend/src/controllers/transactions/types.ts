import { z } from 'zod';

// Validation schemas
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

// Type definitions
export type CreateTransactionRequest = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof updateTransactionSchema>;

export interface TransactionResponse {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  category_name: string;
  date: string;
  time?: string;
  notes?: string;
  receipt_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionQueryParams {
  page?: number;
  per_page?: number;
  category_id?: string;
  date_from?: string;
  date_to?: string;
}
