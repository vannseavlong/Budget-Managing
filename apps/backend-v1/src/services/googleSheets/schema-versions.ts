/**
 * Schema Version Management for Google Sheets Database
 * 
 * This file maintains all schema versions and migrations.
 * When adding new sheets or columns, increment the CURRENT_VERSION
 * and add the changes to the migrations array.
 */

export const CURRENT_SCHEMA_VERSION = 2; // Increment when making schema changes

export interface SheetSchema {
  name: string;
  columns: string[];
}

/**
 * Base schema - Version 1
 * This is the initial schema that all users start with
 */
export const BASE_SCHEMA: Record<string, string[]> = {
  users: [
    'id',
    'name',
    'email',
    'password_hash',
    'telegram_username', // Added for OTP integration
    'chatId', // Added for OTP integration
    'created_at',
    'updated_at',
  ],
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
  categories: [
    'id',
    'user_id',
    'name',
    'emoji', // Added for better UX
    'color',
    'created_at',
    'updated_at',
  ],
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
  budget_incomes: [
    'id',
    'user_id',
    'year',
    'month',
    'amount',
    'source',
    'created_at',
    'updated_at',
  ],
  // OTP Authentication tables (Version 2)
  otp_users: [
    'id',
    'email',
    'password_hash',
    'telegram_user_id',
    'telegram_username',
    'created_at',
    'updated_at',
  ],
  telegram_credentials: [
    'id',
    'user_id',
    'telegram_user_id',
    'telegram_username',
    'chat_id',
    'linked_at',
  ],
  otp_requests: [
    'id',
    'user_id',
    'otp_hash',
    'purpose',
    'expires_at',
    'used',
    'used_at',
    'created_at',
  ],
  recovery_codes: [
    'id',
    'user_id',
    'code_hash',
    'used',
    'used_at',
    'created_at',
  ],
  link_tokens: [
    'id',
    'user_id',
    'token',
    'expires_at',
    'used',
    'used_at',
    'created_at',
  ],
};

/**
 * Migration definition
 * Each migration describes what changed in that version
 */
export interface SchemaMigration {
  version: number;
  description: string;
  newSheets?: string[]; // New sheets to create
  sheetUpdates?: {
    // Columns to add to existing sheets
    sheetName: string;
    newColumns: string[];
  }[];
}

/**
 * All migrations in chronological order
 * Version 1 is the BASE_SCHEMA, so migrations start from version 2
 */
export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    version: 2,
    description: 'Added OTP authentication tables and enhanced existing tables',
    newSheets: [
      'otp_users',
      'telegram_credentials',
      'otp_requests',
      'recovery_codes',
      'link_tokens',
    ],
    sheetUpdates: [
      {
        sheetName: 'users',
        newColumns: ['telegram_username', 'chatId'],
      },
      {
        sheetName: 'categories',
        newColumns: ['emoji'],
      },
    ],
  },
  // Add future migrations here
  // {
  //   version: 3,
  //   description: 'Added accounts table for multi-account support',
  //   newSheets: ['accounts'],
  //   sheetUpdates: [
  //     {
  //       sheetName: 'transactions',
  //       newColumns: ['account_id'],
  //     },
  //   ],
  // },
];

/**
 * Get all sheet names that should exist in current version
 */
export function getAllSheetNames(): string[] {
  return Object.keys(BASE_SCHEMA);
}

/**
 * Get the column headers for a specific sheet
 */
export function getSheetColumns(sheetName: string): string[] {
  return BASE_SCHEMA[sheetName] || [];
}
