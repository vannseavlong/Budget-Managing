/**
 * Goals Types - matches the backend's snake_case response contract
 * (see apps/backend/src/controllers/goals/types.ts) directly.
 */

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  name: string;
  limit_amount: number;
  period: GoalPeriod;
  notify_telegram: boolean;
  last_notified_at: string | null;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGoalRequest {
  name: string;
  limit_amount: number;
  period: GoalPeriod;
  notify_telegram?: boolean;
}

export type UpdateGoalRequest = Partial<CreateGoalRequest>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type GoalsListResponse = ApiResponse<Goal[]>;
export type GoalResponse = ApiResponse<Goal>;
