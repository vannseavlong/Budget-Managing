/**
 * Categories Types - Complete type definitions for category operations
 */

// Base Category interface
export interface Category {
  id: string;
  name: string;
  emoji: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Create Category Request payload
export interface CreateCategoryRequest {
  name: string;
  emoji: string;
  color?: string; // Keep for transition period
}

// Update Category Request payload
export interface UpdateCategoryRequest {
  name?: string;
  emoji?: string;
  color?: string; // Keep for transition period
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// Categories API Response types
export type CategoriesListResponse = ApiResponse<Category[]>;
export type CategoryResponse = ApiResponse<Category>;
export type CategoryDeleteResponse = ApiResponse<void>;

// Category with transactions count (for enhanced display)
export interface CategoryWithStats extends Category {
  transactionCount: number;
  totalAmount: number;
}

// Category filter options
export interface CategoryFilters {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Hook state interfaces
export interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Form validation schemas
export interface CategoryFormData {
  name: string;
  emoji: string;
}

export interface CategoryFormErrors {
  name?: string;
  emoji?: string;
  general?: string;
}

// Action types for category operations
export type CategoryAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Category[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'CREATE_START' }
  | { type: 'CREATE_SUCCESS'; payload: Category }
  | { type: 'CREATE_ERROR'; payload: string }
  | { type: 'UPDATE_START' }
  | { type: 'UPDATE_SUCCESS'; payload: Category }
  | { type: 'UPDATE_ERROR'; payload: string }
  | { type: 'DELETE_START' }
  | { type: 'DELETE_SUCCESS'; payload: string }
  | { type: 'DELETE_ERROR'; payload: string }
  | { type: 'RESET_ERROR' };

// Constants
export const CATEGORY_EMOJIS = [
  '🍽️', // Food & Dining
  '🚗', // Transportation
  '💡', // Bills & Utilities
  '🛍️', // Shopping
  '🎬', // Entertainment
  '🏥', // Healthcare
  '📚', // Education
  '💰', // Finance
  '🏠', // Home
  '✈️', // Travel
  '🎯', // Goals
  '📂', // Other
  '💳', // Credit Card
  '⛽', // Gas
  '📱', // Technology
] as const;

export const CATEGORY_VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  EMOJI_MAX_LENGTH: 4,
} as const;
