/**
 * Categories Service Tests - Unit tests for categories service layer
 */

import { CategoriesService } from '../../lib/categories-service';
import httpClient from '../../lib/http-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../types/categories';

// Mock the http client
jest.mock('../../lib/http-client');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

// Mock API_ENDPOINTS
jest.mock('../../lib/api-config', () => ({
  API_ENDPOINTS: {
    CATEGORIES: {
      LIST: 'http://localhost:3001/api/v1/categories',
      CREATE: 'http://localhost:3001/api/v1/categories',
      GET: (id: string) => `http://localhost:3001/api/v1/categories/${id}`,
      UPDATE: (id: string) => `http://localhost:3001/api/v1/categories/${id}`,
      DELETE: (id: string) => `http://localhost:3001/api/v1/categories/${id}`,
    },
  },
}));

describe('CategoriesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Food',
          emoji: '🍔',
          userId: 'user1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCategories,
          message: 'Categories retrieved successfully',
        },
      });

      const result = await CategoriesService.getCategories();

      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.CATEGORIES.LIST
      );
      expect(result).toEqual(mockCategories);
    });

    it('should handle API error response', async () => {
      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Failed to fetch categories',
        },
      });

      await expect(CategoriesService.getCategories()).rejects.toThrow(
        'Failed to fetch categories'
      );
    });

    it('should handle network error', async () => {
      mockedHttpClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(CategoriesService.getCategories()).rejects.toThrow(
        'Failed to fetch categories'
      );
    });

    it('should include filters in query string', async () => {
      const filters = {
        search: 'food',
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      };

      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [],
          message: 'Categories retrieved successfully',
        },
      });

      await CategoriesService.getCategories(filters);

      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.CATEGORIES.LIST}?search=food&sortBy=name&sortOrder=asc`
      );
    });
  });

  describe('getCategory', () => {
    it('should fetch a single category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Food',
        emoji: '🍔',
        userId: 'user1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCategory,
          message: 'Category retrieved successfully',
        },
      });

      const result = await CategoriesService.getCategory('1');

      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.CATEGORIES.GET('1')
      );
      expect(result).toEqual(mockCategory);
    });

    it('should handle category not found', async () => {
      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Category not found',
        },
      });

      await expect(CategoriesService.getCategory('1')).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('createCategory', () => {
    const validPayload: CreateCategoryRequest = {
      name: 'Food',
      emoji: '🍔',
    };

    it('should create a category successfully', async () => {
      const mockCreatedCategory = {
        id: '1',
        name: 'Food',
        emoji: '🍔',
        userId: 'user1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockedHttpClient.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCreatedCategory,
          message: 'Category created successfully',
        },
      });

      const result = await CategoriesService.createCategory(validPayload);

      expect(mockedHttpClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.CATEGORIES.CREATE,
        validPayload
      );
      expect(result).toEqual(mockCreatedCategory);
    });

    it('should validate payload before sending', async () => {
      const invalidPayload: CreateCategoryRequest = {
        name: '',
        emoji: '🍔',
      };

      await expect(
        CategoriesService.createCategory(invalidPayload)
      ).rejects.toThrow('Category name is required');

      expect(mockedHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate color format', async () => {
      const invalidPayload: CreateCategoryRequest = {
        name: 'Food',
        emoji: 'invalid-emoji',
      };

      await expect(
        CategoriesService.createCategory(invalidPayload)
      ).rejects.toThrow('Invalid emoji format');

      expect(mockedHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    const validPayload: UpdateCategoryRequest = {
      name: 'Updated Food',
      emoji: '🟢',
    };

    it('should update a category successfully', async () => {
      const mockUpdatedCategory = {
        id: '1',
        name: 'Updated Food',
        emoji: '🟢',
        userId: 'user1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      mockedHttpClient.put.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockUpdatedCategory,
          message: 'Category updated successfully',
        },
      });

      const result = await CategoriesService.updateCategory('1', validPayload);

      expect(mockedHttpClient.put).toHaveBeenCalledWith(
        API_ENDPOINTS.CATEGORIES.UPDATE('1'),
        validPayload
      );
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should validate partial update payload', async () => {
      const invalidPayload: UpdateCategoryRequest = {
        name: '',
      };

      await expect(
        CategoriesService.updateCategory('1', invalidPayload)
      ).rejects.toThrow('Category name cannot be empty');

      expect(mockedHttpClient.put).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      mockedHttpClient.delete.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Category deleted successfully',
        },
      });

      await CategoriesService.deleteCategory('1');

      expect(mockedHttpClient.delete).toHaveBeenCalledWith(
        API_ENDPOINTS.CATEGORIES.DELETE('1')
      );
    });

    it('should handle delete error', async () => {
      mockedHttpClient.delete.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Cannot delete category with transactions',
        },
      });

      await expect(CategoriesService.deleteCategory('1')).rejects.toThrow(
        'Cannot delete category with transactions'
      );
    });
  });

  describe('Utility functions', () => {
    describe('getRandomEmoji', () => {
      it('should return a valid emoji', () => {
        const emoji = CategoriesService.getRandomEmoji();
        // emoji should be a non-empty string (basic sanity check)
        expect(typeof emoji).toBe('string');
        expect(emoji.length).toBeGreaterThan(0);
      });
    });

    describe('isNameUnique', () => {
      const categories = [
        {
          id: '1',
          name: 'Food',
          emoji: '🍔',
          userId: 'user1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Transport',
          emoji: '🚌',
          userId: 'user1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      it('should return true for unique name', () => {
        const result = CategoriesService.isNameUnique('Shopping', categories);
        expect(result).toBe(true);
      });

      it('should return false for duplicate name', () => {
        const result = CategoriesService.isNameUnique('Food', categories);
        expect(result).toBe(false);
      });

      it('should return true when excluding current category', () => {
        const result = CategoriesService.isNameUnique('Food', categories, '1');
        expect(result).toBe(true);
      });

      it('should be case insensitive', () => {
        const result = CategoriesService.isNameUnique('FOOD', categories);
        expect(result).toBe(false);
      });
    });
  });
});
