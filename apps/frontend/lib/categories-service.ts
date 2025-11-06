/**
 * Categories Service - Clean API layer for category operations
 * Handles all category-related HTTP requests with proper error handling
 */

import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoriesListResponse,
  CategoryResponse,
  CategoryDeleteResponse,
  CategoryFilters,
  ApiResponse,
} from '../types/categories';

export class CategoriesService {
  /**
   * Fetch all categories with optional filtering
   */
  static async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    try {
      const params = new URLSearchParams();

      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.CATEGORIES.LIST}?${queryString}`
        : API_ENDPOINTS.CATEGORIES.LIST;

      const response = await httpClient.get<CategoriesListResponse>(url);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch categories');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw this.handleError(error, 'Failed to fetch categories');
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategory(id: string): Promise<Category> {
    try {
      const response = await httpClient.get<CategoryResponse>(
        API_ENDPOINTS.CATEGORIES.GET(id)
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Category not found');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw this.handleError(error, 'Failed to fetch category');
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    payload: CreateCategoryRequest
  ): Promise<Category> {
    try {
      // Validate payload before sending
      this.validateCategoryPayload(payload);

      const response = await httpClient.post<CategoryResponse>(
        API_ENDPOINTS.CATEGORIES.CREATE,
        payload
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create category');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw this.handleError(error, 'Failed to create category');
    }
  }

  /**
   * Update an existing category
   */
  static async updateCategory(
    id: string,
    payload: UpdateCategoryRequest
  ): Promise<Category> {
    try {
      // Validate payload before sending
      this.validateUpdatePayload(payload);

      const response = await httpClient.put<CategoryResponse>(
        API_ENDPOINTS.CATEGORIES.UPDATE(id),
        payload
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update category');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw this.handleError(error, 'Failed to update category');
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(id: string): Promise<void> {
    try {
      const response = await httpClient.delete<CategoryDeleteResponse>(
        API_ENDPOINTS.CATEGORIES.DELETE(id)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw this.handleError(error, 'Failed to delete category');
    }
  }

  /**
   * Validate create category payload
   */
  private static validateCategoryPayload(payload: CreateCategoryRequest): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    if (payload.name.length > 50) {
      throw new Error('Category name must be less than 50 characters');
    }

    if (!payload.emoji || payload.emoji.trim().length === 0) {
      throw new Error('Emoji is required');
    }

    if (payload.emoji.length > 4) {
      throw new Error('Invalid emoji format');
    }
  }

  /**
   * Validate update category payload
   */
  private static validateUpdatePayload(payload: UpdateCategoryRequest): void {
    if (payload.name !== undefined) {
      if (!payload.name || payload.name.trim().length === 0) {
        throw new Error('Category name cannot be empty');
      }

      if (payload.name.length > 50) {
        throw new Error('Category name must be less than 50 characters');
      }
    }

    if (payload.emoji !== undefined) {
      if (!payload.emoji || payload.emoji.trim().length === 0) {
        throw new Error('Emoji is required');
      }

      if (payload.emoji.length > 4) {
        throw new Error('Invalid emoji format');
      }
    }
  }

  /**
   * Centralized error handling
   */
  private static handleError(error: any, fallbackMessage: string): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.message) {
      return new Error(error.message);
    }

    return new Error(fallbackMessage);
  }

  /**
   * Generate a random emoji from predefined palette
   */
  static getRandomEmoji(): string {
    const emojis = [
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
      '🎮', // Gaming
      '🏃', // Fitness
      '☕', // Coffee/Cafe
    ];

    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Check if category name is unique (client-side validation)
   */
  static isNameUnique(
    name: string,
    categories: Category[],
    excludeId?: string
  ): boolean {
    return !categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== excludeId
    );
  }

  /**
   * Migrate categories to include emoji field (one-time migration)
   */
  static async migrateEmojis(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const response = await httpClient.post<ApiResponse<any>>(
        API_ENDPOINTS.CATEGORIES.MIGRATE_EMOJIS
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Migration failed');
      }

      return {
        success: true,
        message: response.data.message || 'Migration completed successfully',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error migrating emojis:', error);
      throw this.handleError(error, 'Failed to migrate emojis');
    }
  }
}
