import { z } from 'zod';

// Validation schemas
export const createSpreadsheetSchema = z.object({
  name: z.string().min(1, 'Spreadsheet name is required').optional(),
  template: z.enum(['default', 'basic', 'advanced']).default('default'),
});

export const shareSpreadsheetSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['viewer', 'editor', 'owner']).default('viewer'),
});

export const importDataSchema = z.object({
  data: z.array(z.array(z.string())),
  sheet_name: z.string().min(1, 'Sheet name is required'),
  mode: z.enum(['append', 'overwrite', 'insert']).default('append'),
});

// Type definitions
export type CreateSpreadsheetData = z.infer<typeof createSpreadsheetSchema>;
export type ShareSpreadsheetData = z.infer<typeof shareSpreadsheetSchema>;
export type ImportData = z.infer<typeof importDataSchema>;

// Database schema definition
export const databaseSchema = {
  users: ['id', 'name', 'email', 'password_hash', 'created_at', 'updated_at'],
  settings: [
    'user_id',
    'currency',
    'language',
    'dark_mode',
    'telegram_notifications',
    'telegram_chat_id',
    'created_at',
    'updated_at',
  ],
  categories: ['id', 'user_id', 'name', 'color', 'created_at', 'updated_at'],
  transactions: [
    'id',
    'user_id',
    'name',
    'amount',
    'category_id',
    'category_name',
    'date',
    'time',
    'notes',
    'receipt_url',
    'created_at',
    'updated_at',
  ],
  budgets: [
    'id',
    'user_id',
    'year',
    'month',
    'income',
    'created_at',
    'updated_at',
  ],
  budget_items: [
    'id',
    'budget_id',
    'category_id',
    'category_name',
    'amount',
    'spent',
    'created_at',
    'updated_at',
  ],
  goals: [
    'id',
    'user_id',
    'name',
    'limit_amount',
    'period',
    'notify_telegram',
    'last_notified_at',
    'created_at',
    'updated_at',
  ],
  telegram_messages: [
    'id',
    'user_id',
    'chat_id',
    'payload',
    'status',
    'error',
    'sent_at',
    'created_at',
  ],
};
