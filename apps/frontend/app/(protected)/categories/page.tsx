'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Info, Tag } from 'lucide-react';
import { EditCategoryDialog } from '@/components/common/EditCategoryDialog';
import { AddCategoryDialog } from '@/components/common/AddCategoryDialog';

interface Category {
  id: string;
  name: string;
  emoji: string;
  color?: string; // Keep for backward compatibility
  created: string;
  usage: string;
  transactionCount: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Emoji to color mapping for backward compatibility
const emojiToColorMap: Record<string, string> = {
  '🍽️': '#FF6B6B', // Food & Dining - Red
  '🚗': '#4ECDC4', // Transportation - Teal
  '💡': '#FFD93D', // Bills & Utilities - Yellow
  '🛍️': '#6BCF7F', // Shopping - Green
  '🎬': '#4D96FF', // Entertainment - Blue
  '🏥': '#FF6B9D', // Healthcare - Pink
  '📚': '#C44569', // Education - Purple
  '💰': '#F8B500', // Finance - Orange
  '🏠': '#54A0FF', // Home - Light Blue
  '✈️': '#5F27CD', // Travel - Dark Purple
  '🎯': '#FF9F43', // Goals - Orange
  '📂': '#8395A7', // Other - Gray
  '💳': '#3867D6', // Credit Card - Blue
  '⛽': '#20BF6B', // Gas - Green
  '📱': '#FF9FF3', // Technology - Pink
};

// Get color from emoji
const getColorFromEmoji = (emoji: string): string => {
  return emojiToColorMap[emoji] || '#3B82F6'; // Default blue
};

// Mapping function to convert API data to UI format
const mapApiCategoryToUI = (apiCategory: any): Category => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const month = monthNames[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
  };

  return {
    id: apiCategory.id,
    name: apiCategory.name,
    emoji: apiCategory.emoji || '📂', // Use emoji directly from API, fallback to default
    color: apiCategory.color, // Keep color for backward compatibility if needed
    created: formatDate(apiCategory.createdAt || new Date().toISOString()),
    usage: 'Not used', // Will be updated when we have transaction integration
    transactionCount: 0, // Will be updated when we have transaction integration
    userId: apiCategory.userId,
    createdAt: apiCategory.createdAt,
    updatedAt: apiCategory.updatedAt,
  };
};

export default function CategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use our categories hook for API integration
  const {
    categories: apiCategories,
    loading,
    error,
    isCreating,
    isUpdating,
    // isDeleting, // Commented out as not needed in this UI
    createCategory,
    updateCategory,
    deleteCategory,
    resetError,
  } = useCategories();

  // Convert API categories to UI format
  const categories = apiCategories.map(mapApiCategoryToUI);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Show error messages via toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      resetError();
    }
  }, [error, toast, resetError]);

  // Pagination logic
  const totalPages = Math.ceil(categories.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCategories = categories.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCategory = async (
    id: string,
    name: string,
    emoji: string
  ) => {
    try {
      await updateCategory(id, {
        name,
        emoji,
        color: getColorFromEmoji(emoji), // Add color for backward compatibility
      });

      setIsEditDialogOpen(false);
      setEditingCategory(null);

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async (name: string, emoji: string) => {
    try {
      await createCategory({
        name,
        emoji,
        color: getColorFromEmoji(emoji), // Add color for backward compatibility
      });

      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const ActionDropdown = ({ category }: { category: Category }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleEditCategory(category)}
          className="cursor-pointer"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDeleteCategory(category.id)}
          className="cursor-pointer text-red-600 focus:text-red-600"
          disabled={category.transactionCount > 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your spending categories
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            All Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-3">Usage</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Loading categories...
                  </div>
                </div>
              ) : currentCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No categories found</p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="mt-2"
                    size="sm"
                  >
                    Create your first category
                  </Button>
                </div>
              ) : (
                currentCategories.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50"
                  >
                    {/* Name with Emoji */}
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="text-lg">{category.emoji}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {category.created}
                    </div>

                    {/* Usage */}
                    <div className="col-span-3">
                      <span
                        className={`text-sm ${
                          category.transactionCount > 0
                            ? 'text-green-600 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {category.usage}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end">
                      <ActionDropdown category={category} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{' '}
                {Math.min(endIndex, categories.length)} of {categories.length}{' '}
                categories
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                About Categories
              </h3>
              <p className="text-sm text-blue-700">
                Categories help you organize and track your spending.
                They&apos;re used in budgets, transactions, and reports. You can
                edit or delete categories at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
        isLoading={isUpdating}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCategory}
        isLoading={isCreating}
      />
    </div>
  );
}
