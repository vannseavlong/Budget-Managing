import { z } from 'zod';

// Validation schemas
export const updateSettingsSchema = z.object({
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  language: z
    .string()
    .min(2, 'Language must be at least 2 characters')
    .optional(),
  dark_mode: z.boolean().optional(),
  telegram_notifications: z.boolean().optional(),
  telegram_chat_id: z.string().optional(),
});

export type UpdateSettingsData = z.infer<typeof updateSettingsSchema>;

// Default settings
export const defaultSettings = {
  currency: 'USD',
  language: 'en',
  dark_mode: false,
  telegram_notifications: false,
  telegram_chat_id: null,
};
