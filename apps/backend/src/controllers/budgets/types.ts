import { z } from 'zod';

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

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

export type CreateBudgetRequest = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetRequest = z.infer<typeof updateBudgetSchema>;

export interface BudgetResponse {
  id: string;
  year: number;
  month: number;
  income: number;
  user_id: string;
  created_at: string | undefined;
  updated_at: string | undefined;
}

// ---------------------------------------------------------------------------
// Budget items
// ---------------------------------------------------------------------------

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

export type CreateBudgetItemRequest = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemRequest = z.infer<typeof updateBudgetItemSchema>;

export interface BudgetItemResponse {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  user_id: string;
  created_at: string | undefined;
  updated_at: string | undefined;
}

// ---------------------------------------------------------------------------
// Budget incomes
// ---------------------------------------------------------------------------

export const createIncomeSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative('Amount must be non-negative'),
  source: z.string().optional(),
});

export const updateIncomeSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative('Amount must be non-negative'),
  source: z.string().optional(),
});

export type CreateIncomeRequest = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeRequest = z.infer<typeof updateIncomeSchema>;

export interface BudgetIncomeResponse {
  id: string;
  year: number;
  month: number;
  amount: number;
  source: string;
  user_id: string;
  created_at: string | undefined;
  updated_at: string | undefined;
}

export interface BudgetQueryParams {
  year?: number;
  month?: number;
}
