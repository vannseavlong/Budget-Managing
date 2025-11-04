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

// Type definitions
export type SendTelegramMessageData = z.infer<typeof sendTelegramMessageSchema>;
export type ConfigureWebhookData = z.infer<typeof configureWebhookSchema>;

// Telegram message types
export interface TelegramMessage {
  id: string;
  chat_id: string;
  payload: {
    type: 'budget_alert' | 'goal_alert' | 'transaction_reminder' | 'custom';
    message: string;
    data?: Record<string, any>;
  };
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error?: string;
  created_at: string;
}

// Telegram bot configuration
export interface TelegramBotConfig {
  bot_token?: string;
  bot_username?: string;
  is_connected: boolean;
  webhook_configured: boolean;
  webhook_url?: string;
}

// Get bot token from environment variable
export function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}
