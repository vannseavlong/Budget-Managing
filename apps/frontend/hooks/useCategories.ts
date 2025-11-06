/**
 * Categories Hook - Comprehensive state management for category operations
 * Provides clean interface for components to interact with categories
 */

import { useReducer, useCallback, useEffect, useState } from 'react';
import { CategoriesService } from '../lib/categories-service';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryFilters,
  CategoriesState,
  CategoryAction,
} from '../types/categories';

// Initial state
const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
};

// Reducer function
function categoriesReducer(
  state: CategoriesState,
  action: CategoryAction
): CategoriesState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        categories: action.payload,
        error: null,
      };

    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'CREATE_START':
      return {
        ...state,
        isCreating: true,
        error: null,
      };

    case 'CREATE_SUCCESS':
      return {
        ...state,
        isCreating: false,
        categories: [...state.categories, action.payload],
        error: null,
      };

    case 'CREATE_ERROR':
      return {
        ...state,
        isCreating: false,
        error: action.payload,
      };

    case 'UPDATE_START':
      return {
        ...state,
        isUpdating: true,
        error: null,
      };

    case 'UPDATE_SUCCESS':
      return {
        ...state,
        isUpdating: false,
        categories: state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category
        ),
        error: null,
      };

    case 'UPDATE_ERROR':
      return {
        ...state,
        isUpdating: false,
        error: action.payload,
      };

    case 'DELETE_START':
      return {
        ...state,
        isDeleting: true,
        error: null,
      };

    case 'DELETE_SUCCESS':
      return {
        ...state,
        isDeleting: false,
        categories: state.categories.filter(
          (category) => category.id !== action.payload
        ),
        error: null,
      };

    case 'DELETE_ERROR':
      return {
        ...state,
        isDeleting: false,
        error: action.payload,
      };

    case 'RESET_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Hook interface
export interface UseCategoriesReturn {
  // State
  categories: Category[];
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Actions
  fetchCategories: (filters?: CategoryFilters) => Promise<void>;
  createCategory: (payload: CreateCategoryRequest) => Promise<Category>;
  updateCategory: (
    id: string,
    payload: UpdateCategoryRequest
  ) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  resetError: () => void;

  // Utilities
  getCategoryById: (id: string) => Category | undefined;
  isCategoryNameUnique: (name: string, excludeId?: string) => boolean;
}

/**
 * Main categories hook
 */
export function useCategories(autoFetch: boolean = true): UseCategoriesReturn {
  const [state, dispatch] = useReducer(categoriesReducer, initialState);

  /**
   * Fetch categories with optional filters
   */
  const fetchCategories = useCallback(async (filters?: CategoryFilters) => {
    dispatch({ type: 'FETCH_START' });

    try {
      const categories = await CategoriesService.getCategories(filters);
      dispatch({ type: 'FETCH_SUCCESS', payload: categories });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch categories';
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  }, []);

  /**
   * Create a new category
   */
  const createCategory = useCallback(
    async (payload: CreateCategoryRequest): Promise<Category> => {
      dispatch({ type: 'CREATE_START' });

      try {
        const newCategory = await CategoriesService.createCategory(payload);
        dispatch({ type: 'CREATE_SUCCESS', payload: newCategory });
        return newCategory;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create category';
        dispatch({ type: 'CREATE_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  /**
   * Update an existing category
   */
  const updateCategory = useCallback(
    async (id: string, payload: UpdateCategoryRequest): Promise<Category> => {
      dispatch({ type: 'UPDATE_START' });

      try {
        const updatedCategory = await CategoriesService.updateCategory(
          id,
          payload
        );
        dispatch({ type: 'UPDATE_SUCCESS', payload: updatedCategory });
        return updatedCategory;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update category';
        dispatch({ type: 'UPDATE_ERROR', payload: errorMessage });
        throw error;
      }
    },
    []
  );

  /**
   * Delete a category
   */
  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'DELETE_START' });

    try {
      await CategoriesService.deleteCategory(id);
      dispatch({ type: 'DELETE_SUCCESS', payload: id });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete category';
      dispatch({ type: 'DELETE_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Refresh categories (refetch with current filters)
   */
  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    dispatch({ type: 'RESET_ERROR' });
  }, []);

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback(
    (id: string): Category | undefined => {
      return state.categories.find((category) => category.id === id);
    },
    [state.categories]
  );

  /**
   * Check if category name is unique
   */
  const isCategoryNameUnique = useCallback(
    (name: string, excludeId?: string): boolean => {
      return CategoriesService.isNameUnique(name, state.categories, excludeId);
    },
    [state.categories]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  return {
    // State
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,

    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    resetError,

    // Utilities
    getCategoryById,
    isCategoryNameUnique,
  };
}

/**
 * Hook for single category operations
 */
export function useCategory(id: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedCategory = await CategoriesService.getCategory(id);
      setCategory(fetchedCategory);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch category';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory,
  };
}
