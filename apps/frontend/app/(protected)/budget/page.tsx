'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useBudget from '@/hooks/useBudget';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BudgetTable } from '@/components/common/BudgetTable';
import { EditBudgetItemDialog } from '@/components/common/EditBudgetItemDialog';
import { MonthlyIncomeCard } from '@/components/budget/MonthlyIncomeCard';
import { MonthSelector } from '@/components/common/MonthSelector';
import { SendToTelegramButton } from '@/components/budget/SendToTelegramButton';
import { Plus, ChevronDown } from 'lucide-react';
import BudgetsService from '@/lib/budgets-service';

interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  spent: number;
  status: 'Spent' | 'Not Yet';
}

export default function BudgetPage() {
  const { user } = useAuth();
  // Selected month in YYYY-MM format
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const {
    budgets,
    selectedBudget,
    items,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    selectBudget,
  } = useBudget();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expectedCost, setExpectedCost] = useState<string>('');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);

  // Keep hook-driven items in sync with local state for the table
  // map hook items (UiBudgetItem) into BudgetItem shape used by the table
  // Ui shape coming from hook: { id, name, cost, status }
  // Update local budgetItems when hook items change
  useEffect(() => {
    if (items && items.length) {
      setBudgetItems(
        items.map((it) => ({
          id: it.id,
          name: it.name,
          cost: it.cost,
          spent: it.spent,
          status: it.status,
        }))
      );
    } else {
      setBudgetItems([]);
    }
  }, [items]);

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Use categories hook to get real categories (id + name)
  const { categories: apiCategories } = useCategories();

  // Helper to get category name from id
  const getCategoryName = (id: string) =>
    apiCategories.find((c) => c.id === id)?.name;

  // initial items are loaded from the hook

  const totalAllocated = budgetItems.reduce((sum, item) => sum + item.cost, 0);
  // Use the selected budget's income
  const effectiveIncome = selectedBudget?.income || 0;
  const remainingBudget = effectiveIncome - totalAllocated;
  const allocationPercentage =
    effectiveIncome > 0 ? (totalAllocated / effectiveIncome) * 100 : 0;

  const handleAddBudgetItem = async () => {
    // Ensure we have a budget selected; create one automatically if not
    let budgetId = selectedBudget?.id;

    // If no budget exists, show an error message
    if (!budgetId) {
      toast({
        title: 'Please set your monthly income first',
        variant: 'destructive',
      });
      return;
    }

    if (budgetId && selectedCategory && expectedCost) {
      try {
        await createBudgetItem({
          budget_id: budgetId,
          category_id: selectedCategory,
          category_name: getCategoryName(selectedCategory) || selectedCategory,
          amount: parseFloat(expectedCost),
        });
        setSelectedCategory('');
        setExpectedCost('');
        toast({ title: 'Budget item added' });
      } catch (err: any) {
        console.error(err);
        const msg = err?.response?.data?.message || err?.message || String(err);
        toast({
          title: 'Failed to add item',
          description: msg,
          variant: 'destructive',
        });
      }
    }
  };

  const toggleItemStatus = async (id: string) => {
    const item = budgetItems.find((i) => i.id === id);
    if (!item) return;
    const newStatus = item.status === 'Spent' ? 'Not Yet' : 'Spent';
    const spent = newStatus === 'Spent' ? item.cost : 0;
    try {
      await updateBudgetItem(id, { spent });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditItem = (id: string) => {
    // Find the item to edit
    const itemToEdit = budgetItems.find((item) => item.id === id);
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEditedItem = async (
    id: string,
    category: string,
    cost: number
  ) => {
    try {
      await updateBudgetItem(id, { category_name: category, amount: cost });
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteBudgetItem(id);
    } catch (err: any) {
      console.error(err);
    }
  };

  // When selected month changes, load the budget for that month
  React.useEffect(() => {
    const loadBudgetForMonth = async () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      const budgets = await BudgetsService.getBudgets({ year, month });
      if (budgets && budgets.length > 0) {
        selectBudget(budgets[0].id);
      }
    };
    loadBudgetForMonth();
  }, [selectedMonth]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Set your monthly income and allocate spending by category
          </p>
        </div>
        {/* Month Selector and Send to Telegram */}
        <div className="flex items-center gap-2">
          <SendToTelegramButton
            budget={selectedBudget}
            budgetItems={items.map((it) => ({
              id: it.id,
              budget_id: selectedBudget?.id || '',
              category_id: '',
              category_name: it.name,
              amount: it.cost,
              spent: it.spent,
            }))}
          />
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>
      </div>

      {/* Monthly Income and Budget Allocation - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income */}
        <MonthlyIncomeCard
          selectedMonth={selectedMonth}
          onIncomeChange={async () => {
            // Reload budget when income changes
            const [year, month] = selectedMonth.split('-').map(Number);
            const budgets = await BudgetsService.getBudgets({ year, month });
            if (budgets && budgets.length > 0) {
              selectBudget(budgets[0].id);
            }
          }}
        />

        {/* Budget Allocation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget Allocation</CardTitle>
              <span className="text-sm font-medium text-gray-600">
                ${remainingBudget} left
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  ${totalAllocated.toLocaleString()} / $
                  {effectiveIncome.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  {Math.round(allocationPercentage)}% allocated
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all duration-300"
                  style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories Form */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <Label
                htmlFor="category"
                className="text-sm font-medium text-gray-700"
              >
                Category
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-1"
                    id="category"
                  >
                    {getCategoryName(selectedCategory) || 'Select category'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {apiCategories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:col-span-4">
              <Label
                htmlFor="cost"
                className="text-sm font-medium text-gray-700"
              >
                Expected Cost
              </Label>
              <div className="flex items-center mt-1">
                <span className="text-sm mr-2">$</span>
                <Input
                  id="cost"
                  type="number"
                  value={expectedCost}
                  onChange={(e) => setExpectedCost(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={handleAddBudgetItem}
                className="w-full bg-gray-600 hover:bg-gray-700"
                disabled={!selectedCategory || !expectedCost}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocated Budget Items */}
      <Card>
        <CardHeader>
          <CardTitle>Allocated Budget Items</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetTable
            items={budgetItems}
            onToggleStatus={toggleItemStatus}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            pageSize={4}
          />
        </CardContent>
      </Card>

      {/* Edit Budget Item Dialog */}
      <EditBudgetItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleSaveEditedItem}
        categories={apiCategories.map((c) => c.name)}
      />
    </div>
  );
}
