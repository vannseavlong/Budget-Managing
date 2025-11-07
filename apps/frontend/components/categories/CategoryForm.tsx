/**
 * Category Form Component - Reusable form for creating and editing categories
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Category,
  CategoryFormData,
  CategoryFormErrors,
} from '@/types/categories';
import { CATEGORY_EMOJIS, CATEGORY_VALIDATION } from '@/types/categories';
import { CategoriesService } from '@/lib/categories-service';

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Category;
  onSubmit: (
    data: CreateCategoryRequest | UpdateCategoryRequest
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  existingCategories?: Category[];
}

export function CategoryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  existingCategories = [],
}: CategoryFormProps) {
  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    emoji: initialData?.emoji || CategoriesService.getRandomEmoji(),
  });

  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        emoji: initialData.emoji,
      });
    }
  }, [initialData]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: CategoryFormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < CATEGORY_VALIDATION.NAME_MIN_LENGTH) {
      newErrors.name = `Category name must be at least ${CATEGORY_VALIDATION.NAME_MIN_LENGTH} character`;
    } else if (formData.name.length > CATEGORY_VALIDATION.NAME_MAX_LENGTH) {
      newErrors.name = `Category name must be less than ${CATEGORY_VALIDATION.NAME_MAX_LENGTH} characters`;
    } else {
      // Check for duplicate names
      const isDuplicate = existingCategories.some(
        (category) =>
          category.name.toLowerCase() === formData.name.toLowerCase() &&
          category.id !== initialData?.id
      );

      if (isDuplicate) {
        newErrors.name = 'A category with this name already exists';
      }
    }

    // Validate emoji
    if (!formData.emoji) {
      newErrors.emoji = 'Emoji is required';
    } else if (formData.emoji.length > CATEGORY_VALIDATION.EMOJI_MAX_LENGTH) {
      newErrors.emoji = 'Invalid emoji format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        emoji: formData.emoji,
      };

      await onSubmit(payload);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Generate a random color
   */
  const handleRandomEmoji = () => {
    const newEmoji = CategoriesService.getRandomEmoji();
    handleInputChange('emoji', newEmoji);
  };

  const loading = isLoading || isSubmitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Create New Category' : 'Edit Category'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'create'
            ? 'Add a new category to organize your transactions'
            : 'Update the category details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General error */}
        {errors.general && (
          <Alert variant="destructive">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Category Name */}
        <div className="space-y-2">
          <Label htmlFor="categoryName">Category Name</Label>
          <Input
            id="categoryName"
            type="text"
            placeholder="Enter category name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={loading}
            className={errors.name ? 'border-destructive' : ''}
            maxLength={CATEGORY_VALIDATION.NAME_MAX_LENGTH}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Emoji Selection */}
        <div className="space-y-2">
          <Label htmlFor="categoryEmoji">Emoji</Label>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 flex-1">
              <div className="w-8 h-8 flex items-center justify-center border-2 border-border rounded">
                <span className="text-lg">{formData.emoji}</span>
              </div>
              <Input
                id="categoryEmoji"
                type="text"
                placeholder="🍽️"
                value={formData.emoji}
                onChange={(e) => handleInputChange('emoji', e.target.value)}
                disabled={loading}
                className={errors.emoji ? 'border-destructive' : ''}
                maxLength={4}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRandomEmoji}
              disabled={loading}
            >
              🎲
            </Button>
          </div>
          {errors.emoji && (
            <p className="text-sm text-destructive">{errors.emoji}</p>
          )}
        </div>

        {/* Predefined Emojis */}
        <div className="space-y-2">
          <Label>Quick Emojis</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInputChange('emoji', emoji)}
                disabled={loading}
                className={`w-8 h-8 flex items-center justify-center border-2 transition-all hover:scale-110 rounded ${
                  formData.emoji === emoji ? 'border-primary' : 'border-border'
                }`}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.name.trim()}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Create Category' : 'Update Category'}
          </Button>
        </div>
      </form>
    </div>
  );
}
