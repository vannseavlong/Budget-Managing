import { z } from 'zod';
import { withId, mapTimestamps } from '../../utils/response';

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

export type CreateGoalRequest = z.infer<typeof createGoalSchema>;
export type UpdateGoalRequest = z.infer<typeof updateGoalSchema>;

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface GoalResponse {
  id: string;
  name: string;
  limit_amount: number;
  period: GoalPeriod;
  notify_telegram: boolean;
  last_notified_at: string | null;
  user_id: string;
  created_at: string | undefined;
  updated_at: string | undefined;
}

/**
 * Maps a raw lsdb `goals` row to backend-v1's original response shape.
 * `user_id` isn't a stored column (actorSheetId already scopes the sheet,
 * see schemas/user/goals.ts) — synthesized here from the authenticated
 * user's email instead.
 */
export function toGoalResponse(
  record: Record<string, unknown> & {
    _id: string;
    _created_at?: string;
    _updated_at?: string;
    _deleted_at?: string | null;
  },
  email: string
): GoalResponse {
  const { id, name, limit_amount, period, notify_telegram, last_notified_at } =
    withId(record);
  const { created_at, updated_at } = mapTimestamps(record, 'snake');

  return {
    id,
    name: name as string,
    limit_amount: limit_amount as number,
    period: period as GoalPeriod,
    notify_telegram: Boolean(notify_telegram),
    last_notified_at: (last_notified_at as string | undefined) ?? null,
    user_id: email,
    created_at,
    updated_at,
  };
}
