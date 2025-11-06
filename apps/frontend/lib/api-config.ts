/**
 * API Configuration - Centralized endpoint management
 * All API endpoints are defined here to avoid hardcoding throughout the app
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    GOOGLE: `${API_BASE_URL}/api/v1/auth/google`,
    CALLBACK: `${API_BASE_URL}/api/v1/auth/callback`,
    LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/v1/auth/refresh`,
    ME: `${API_BASE_URL}/api/v1/auth/profile`,
  },

  // Budget management endpoints
  BUDGETS: {
    LIST: `${API_BASE_URL}/api/v1/budgets`,
    CREATE: `${API_BASE_URL}/api/v1/budgets`,
    GET: (id: string) => `${API_BASE_URL}/api/v1/budgets/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/budgets/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/budgets/${id}`,
  },

  // Categories endpoints
  CATEGORIES: {
    LIST: `${API_BASE_URL}/api/v1/categories`,
    CREATE: `${API_BASE_URL}/api/v1/categories`,
    GET: (id: string) => `${API_BASE_URL}/api/v1/categories/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/categories/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/categories/${id}`,
    MIGRATE_EMOJIS: `${API_BASE_URL}/api/v1/categories/migrate-emojis`,
  },

  // Transactions endpoints
  TRANSACTIONS: {
    LIST: `${API_BASE_URL}/api/v1/transactions`,
    CREATE: `${API_BASE_URL}/api/v1/transactions`,
    GET: (id: string) => `${API_BASE_URL}/api/v1/transactions/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/transactions/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/transactions/${id}`,
    SUMMARY: `${API_BASE_URL}/api/v1/transactions/summary`,
  },

  // Goals endpoints
  GOALS: {
    LIST: `${API_BASE_URL}/api/v1/goals`,
    CREATE: `${API_BASE_URL}/api/v1/goals`,
    GET: (id: string) => `${API_BASE_URL}/api/v1/goals/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/goals/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/v1/goals/${id}`,
  },

  // Settings endpoints
  SETTINGS: {
    GET: `${API_BASE_URL}/api/v1/settings`,
    UPDATE: `${API_BASE_URL}/api/v1/settings`,
  },

  // Google Sheets integration
  SHEETS: {
    CONNECT: `${API_BASE_URL}/api/v1/sheets/connect`,
    SYNC: `${API_BASE_URL}/api/v1/sheets/sync`,
    DISCONNECT: `${API_BASE_URL}/api/v1/sheets/disconnect`,
  },

  // Data export/import
  DATA: {
    EXPORT: `${API_BASE_URL}/api/v1/data/export`,
    IMPORT: `${API_BASE_URL}/api/v1/data/import`,
  },
} as const;

export default API_ENDPOINTS;
