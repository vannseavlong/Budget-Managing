/**
 * Categories List Component - Display and manage categories
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { useCategories } from '@/hooks/useCategories';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/categories';

export function CategoriesList() {
  const {
    categories,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createCategory,
    updateCategory,
    deleteCategory,
    resetError,
  } = useCategories();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handle creating a new category
   */
  const handleCreateCategory = async (
    data: CreateCategoryRequest | UpdateCategoryRequest
  ) => {
    try {
      await createCategory(data as CreateCategoryRequest);
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled by the hook
      throw error;
    }
  };

  /**
   * Handle updating a category
   */
  const handleUpdateCategory = async (
    data: CreateCategoryRequest | UpdateCategoryRequest
  ) => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, data as UpdateCategoryRequest);
      setEditingCategory(null);
    } catch (error) {
      // Error is handled by the hook
      throw error;
    }
  };

  /**
   * Handle deleting a category
   */
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (error) {
      // Error is handled by the hook
      console.error('Failed to delete category:', error);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your transactions with custom categories
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              mode="create"
              onSubmit={handleCreateCategory}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={isCreating}
              existingCategories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={resetError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {searchTerm ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? `No categories match "${searchTerm}"`
                : 'Create your first category to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg shrink-0">{category.emoji}</span>
                  <h3 className="font-medium truncate">{category.name}</h3>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingCategory(category)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingCategory(category)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Created: {formatDate(category.createdAt)}</p>
                <p>Updated: {formatDate(category.updatedAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              mode="edit"
              initialData={editingCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => setEditingCategory(null)}
              isLoading={isUpdating}
              existingCategories={categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the category "
              {deletingCategory?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCategory}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
