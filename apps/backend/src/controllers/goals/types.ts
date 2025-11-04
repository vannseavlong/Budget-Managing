import { z } from 'zod';

// Validation schemas
export const createGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  limit_amount: z.number().positive('Limit amount must be positive'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  notify_telegram: z.boolean().default(false),
});

export const updateGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').optional(),
  limit_amount: z.number().positive('Limit amount must be positive').optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  notify_telegram: z.boolean().optional(),
});

// Type definitions
export type CreateGoalRequest = z.infer<typeof createGoalSchema>;
export type UpdateGoalRequest = z.infer<typeof updateGoalSchema>;

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface GoalResponse {
  id: string;
  name: string;
  limit_amount: number;
  period: GoalPeriod;
  notify_telegram: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GoalProgressResponse {
  goal: GoalResponse;
  current_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_exceeded: boolean;
  period_start: string;
  period_end: string;
}
