import { z } from 'zod';

// Validation schemas for budgets
export const createBudgetSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
  income: z.number().nonnegative('Income must be non-negative'),
});

export const updateBudgetSchema = z.object({
  year: z.number().int().min(2000).max(3000).optional(),
  month: z.number().int().min(1).max(12).optional(),
  income: z.number().nonnegative('Income must be non-negative').optional(),
});

// Validation schemas for budget items
export const createBudgetItemSchema = z.object({
  budget_id: z.string().min(1, 'Budget ID is required'),
  category_id: z.string().min(1, 'Category ID is required'),
  category_name: z.string().min(1, 'Category name is required'),
  amount: z.number().nonnegative('Amount must be non-negative'),
});

export const updateBudgetItemSchema = z.object({
  category_id: z.string().min(1, 'Category ID is required').optional(),
  category_name: z.string().min(1, 'Category name is required').optional(),
  amount: z.number().nonnegative('Amount must be non-negative').optional(),
  spent: z.number().nonnegative('Spent amount must be non-negative').optional(),
});

// Type definitions
export type CreateBudgetRequest = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetRequest = z.infer<typeof updateBudgetSchema>;
export type CreateBudgetItemRequest = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemRequest = z.infer<typeof updateBudgetItemSchema>;

export interface BudgetResponse {
  id: string;
  year: number;
  month: number;
  income: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItemResponse {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetQueryParams {
  year?: number;
  month?: number;
}
