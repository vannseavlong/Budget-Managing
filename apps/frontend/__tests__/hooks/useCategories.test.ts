/**
 * useCategories Hook Tests - Unit tests for categories hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCategories } from '../../hooks/useCategories';
import { CategoriesService } from '../../lib/categories-service';
import type { Category, CreateCategoryRequest } from '../../types/categories';

// Mock the categories service
jest.mock('../../lib/categories-service');
const mockedCategoriesService = CategoriesService as jest.Mocked<
  typeof CategoriesService
>;

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Food',
    color: '#FF6B6B',
    userId: 'user1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Transport',
    color: '#4ECDC4',
    userId: 'user1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
];

describe('useCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCategories(false));

    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });

  it('should auto-fetch categories on mount when enabled', async () => {
    mockedCategoriesService.getCategories.mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories(true));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(mockedCategoriesService.getCategories).toHaveBeenCalledTimes(1);
  });

  it('should not auto-fetch when disabled', () => {
    renderHook(() => useCategories(false));

    expect(mockedCategoriesService.getCategories).not.toHaveBeenCalled();
  });

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );

      const { result } = renderHook(() => useCategories(false));

      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.categories).toEqual(mockCategories);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch categories';
      mockedCategoriesService.getCategories.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCategories(false));

      await act(async () => {
        await result.current.fetchCategories();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should pass filters to service', async () => {
      const filters = { search: 'food', sortBy: 'name' as const };
      mockedCategoriesService.getCategories.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCategories(false));

      await act(async () => {
        await result.current.fetchCategories(filters);
      });

      expect(mockedCategoriesService.getCategories).toHaveBeenCalledWith(
        filters
      );
    });
  });

  describe('createCategory', () => {
    const newCategoryPayload: CreateCategoryRequest = {
      name: 'Shopping',
      color: '#45B7D1',
    };

    const newCategory: Category = {
      id: '3',
      name: 'Shopping',
      color: '#45B7D1',
      userId: 'user1',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    };

    it('should create category successfully', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );
      mockedCategoriesService.createCategory.mockResolvedValueOnce(newCategory);

      const { result } = renderHook(() => useCategories(true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdCategory: Category;
      await act(async () => {
        createdCategory =
          await result.current.createCategory(newCategoryPayload);
      });

      expect(createdCategory!).toEqual(newCategory);
      expect(result.current.categories).toContain(newCategory);
      expect(result.current.isCreating).toBe(false);
    });

    it('should handle create error', async () => {
      const errorMessage = 'Failed to create category';
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );
      mockedCategoriesService.createCategory.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useCategories(true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.createCategory(newCategoryPayload)
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('updateCategory', () => {
    const updatePayload = { name: 'Updated Food' };
    const updatedCategory: Category = {
      ...mockCategories[0],
      name: 'Updated Food',
    };

    it('should update category successfully', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );
      mockedCategoriesService.updateCategory.mockResolvedValueOnce(
        updatedCategory
      );

      const { result } = renderHook(() => useCategories(true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateCategory('1', updatePayload);
      });

      expect(result.current.categories[0]).toEqual(updatedCategory);
      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );
      mockedCategoriesService.deleteCategory.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCategories(true));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCategory('1');
      });

      expect(result.current.categories).not.toContain(mockCategories[0]);
      expect(result.current.categories).toHaveLength(1);
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should get category by ID', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );

      const { result } = renderHook(() => useCategories(true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const category = result.current.getCategoryById('1');
      expect(category).toEqual(mockCategories[0]);
    });

    it('should check if name is unique', async () => {
      mockedCategoriesService.getCategories.mockResolvedValueOnce(
        mockCategories
      );
      mockedCategoriesService.isNameUnique.mockReturnValue(true);

      const { result } = renderHook(() => useCategories(true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const isUnique = result.current.isCategoryNameUnique('Shopping');
      expect(isUnique).toBe(true);
      expect(mockedCategoriesService.isNameUnique).toHaveBeenCalledWith(
        'Shopping',
        mockCategories,
        undefined
      );
    });

    it('should reset error', async () => {
      mockedCategoriesService.getCategories.mockRejectedValueOnce(
        new Error('Test error')
      );

      const { result } = renderHook(() => useCategories(true));

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
