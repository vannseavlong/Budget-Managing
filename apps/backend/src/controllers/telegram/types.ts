import { z } from 'zod';

// Validation schemas
export const sendTelegramMessageSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID is required'),
  payload: z.object({
    type: z.enum([
      'budget_alert',
      'goal_alert',
      'transaction_reminder',
      'custom',
    ]),
    message: z.string().min(1, 'Message is required'),
    data: z.record(z.any()).optional(),
  }),
});

export const configureWebhookSchema = z.object({
  webhook_url: z.string().url('Valid webhook URL is required'),
  bot_token: z.string().min(1, 'Bot token is required').optional(),
});

export const connectTelegramSchema = z.object({
  telegram_data: z.object({
    id: z.union([z.string(), z.number()]),
    username: z.string().optional(),
    first_name: z.string().optional(),
  }),
});

export const setupNotificationsSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID is required'),
  notification_types: z
    .array(
      z.enum(['budget_alert', 'goal_alert', 'transaction_reminder', 'custom'])
    )
    .optional(),
  enable_all: z.boolean().default(false),
});

// Type definitions
export type SendTelegramMessageData = z.infer<typeof sendTelegramMessageSchema>;
export type ConfigureWebhookData = z.infer<typeof configureWebhookSchema>;
export type ConnectTelegramData = z.infer<typeof connectTelegramSchema>;
export type SetupNotificationsData = z.infer<typeof setupNotificationsSchema>;

// Get bot token from environment variable
export function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}
