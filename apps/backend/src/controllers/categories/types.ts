import { z } from 'zod';

// Validation schemas — support both emoji (primary) and color (kept for
// backward compatibility with older frontend payloads, same as backend-v1).
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters'),
  emoji: z.string().min(1, 'Emoji is required').max(4, 'Invalid emoji format'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .optional(),
  emoji: z
    .string()
    .min(1, 'Emoji is required')
    .max(4, 'Invalid emoji format')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(),
});

// apps/frontend's CategoriesService.getCategories() sends these as query
// params — lsdb's `where` is exact-match only, so search/sort happen in
// application code after findMany({}).
export const listCategoriesQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

/** apps/frontend/types/categories.ts `Category` shape — camelCase, no `user_id` column stored. */
export interface CategoryResponse {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  userId: string;
  createdAt: string | undefined;
  updatedAt: string | undefined;
}
