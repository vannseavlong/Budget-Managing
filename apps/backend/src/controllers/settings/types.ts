import { z } from 'zod';
import { withId, mapTimestamps } from '../../utils/response';

/**
 * apps/frontend's settings page also sends two legacy fields left over from
 * the removed OTP-registration flow (`onboarding_profile`,
 * `onboarding_password`) plus occasionally `onboarding_skipped` — none of
 * these map to a `settings` column (see schemas/user/settings.ts) and must
 * be silently ignored rather than rejected. Deliberately no `.strict()`/
 * `.passthrough()` here: plain `z.object(...).partial()` already drops
 * unrecognized keys on `.parse()`, which is exactly the behavior wanted.
 */
export const updateSettingsSchema = z
  .object({
    currency: z.string().min(1),
    language: z.string().min(1),
    dark_mode: z.boolean(),
    telegram_notifications: z.boolean(),
    onboarding_complete: z.boolean(),
  })
  .partial();

export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;

export interface SettingsResponse {
  id: string;
  currency: string;
  language: string;
  dark_mode: boolean;
  telegram_notifications: boolean;
  onboarding_complete: boolean;
  created_at: string | undefined;
  updated_at: string | undefined;
}

export function toSettingsResponse(
  record: Record<string, unknown> & {
    _id: string;
    _created_at?: string;
    _updated_at?: string;
    _deleted_at?: string | null;
  }
): SettingsResponse {
  const {
    id,
    currency,
    language,
    dark_mode,
    telegram_notifications,
    onboarding_complete,
  } = withId(record);
  const { created_at, updated_at } = mapTimestamps(record, 'snake');

  return {
    id,
    currency: currency as string,
    language: language as string,
    dark_mode: Boolean(dark_mode),
    telegram_notifications: Boolean(telegram_notifications),
    onboarding_complete: Boolean(onboarding_complete),
    created_at,
    updated_at,
  };
}
