import { z } from 'zod';

// Validation schemas - Support both color and emoji during transition
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  emoji: z.string().min(1, 'Emoji is required').max(4, 'Invalid emoji format'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(), // Keep for backward compatibility
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  emoji: z
    .string()
    .min(1, 'Emoji is required')
    .max(4, 'Invalid emoji format')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional(), // Keep for backward compatibility
});

// Type definitions
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;

export interface CategoryResponse {
  id: string;
  name: string;
  emoji: string;
  color?: string; // Keep for backward compatibility during transition
  user_id: string;
  created_at: string;
  updated_at: string;
}
