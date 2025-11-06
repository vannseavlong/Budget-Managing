'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  created: string;
  usage: string;
  transactionCount: number;
}

const sampleCategories: Category[] = [
  {
    id: '1',
    name: 'Food & Dining',
    emoji: '🍽️',
    created: '10/29',
    usage: '3 transactions',
    transactionCount: 3,
  },
  {
    id: '2',
    name: 'Transportation',
    emoji: '🚗',
    created: '10/30',
    usage: 'Not used',
    transactionCount: 0,
  },
  {
    id: '3',
    name: 'Bills & Utilities',
    emoji: '💡',
    created: '10/31',
    usage: 'Not used',
    transactionCount: 0,
  },
  {
    id: '4',
    name: 'Shopping',
    emoji: '🛍️',
    created: '11/01',
    usage: 'Not used',
    transactionCount: 0,
  },
  {
    id: '5',
    name: 'Entertainment',
    emoji: '🎬',
    created: '11/02',
    usage: '1 transaction',
    transactionCount: 1,
  },
  {
    id: '6',
    name: 'Healthcare',
    emoji: '🏥',
    created: '11/03',
    usage: 'Not used',
    transactionCount: 0,
  },
  {
    id: '7',
    name: 'Education',
    emoji: '📚',
    created: '11/04',
    usage: 'Not used',
    transactionCount: 0,
  },
  {
    id: '8',
    name: 'Other',
    emoji: '📂',
    created: '11/05',
    usage: 'Not used',
    transactionCount: 0,
  },
];

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(sampleCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  };

  const handleSaveCategory = (id: string, name: string, emoji: string) => {
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, name, emoji } : cat))
    );
    setIsEditDialogOpen(false);
    setEditingCategory(null);
  };

  const handleAddCategory = (name: string, emoji: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      emoji,
      created: new Date().toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
      }),
      usage: 'Not used',
      transactionCount: 0,
    };
    setCategories([...categories, newCategory]);
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
              {currentCategories.map((category) => (
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
              ))}
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
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCategory}
      />
    </div>
  );
}
