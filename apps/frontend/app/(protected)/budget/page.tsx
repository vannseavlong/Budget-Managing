'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BudgetTable } from '@/components/common/BudgetTable';
import { EditBudgetItemDialog } from '@/components/common/EditBudgetItemDialog';
import { Plus, DollarSign, ChevronDown, Send } from 'lucide-react';

interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  status: 'Spent' | 'Not Yet';
}

export default function BudgetPage() {
  const { user } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(1500);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expectedCost, setExpectedCost] = useState<string>('');

  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  const categories = [
    'Food & Dining',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Others',
  ];

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    {
      id: '1',
      name: 'Food & Dining',
      cost: 400,
      status: 'Spent',
    },
    {
      id: '2',
      name: 'Transportation',
      cost: 150,
      status: 'Not Yet',
    },
    {
      id: '3',
      name: 'Bills & Utilities',
      cost: 300,
      status: 'Spent',
    },
    {
      id: '4',
      name: 'Entertainment',
      cost: 150,
      status: 'Not Yet',
    },
    {
      id: '5',
      name: 'Shopping',
      cost: 200,
      status: 'Spent',
    },
    {
      id: '6',
      name: 'Healthcare',
      cost: 100,
      status: 'Not Yet',
    },
    {
      id: '7',
      name: 'Education',
      cost: 250,
      status: 'Spent',
    },
    {
      id: '8',
      name: 'Travel',
      cost: 180,
      status: 'Not Yet',
    },
  ]);

  const totalAllocated = budgetItems.reduce((sum, item) => sum + item.cost, 0);
  const remainingBudget = monthlyIncome - totalAllocated;
  const allocationPercentage = (totalAllocated / monthlyIncome) * 100;

  const handleAddBudgetItem = () => {
    if (selectedCategory && expectedCost) {
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: selectedCategory,
        cost: parseFloat(expectedCost),
        status: 'Not Yet',
      };
      setBudgetItems([...budgetItems, newItem]);
      setSelectedCategory('');
      setExpectedCost('');
    }
  };

  const toggleItemStatus = (id: string) => {
    setBudgetItems(
      budgetItems.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Spent' ? 'Not Yet' : 'Spent' }
          : item
      )
    );
  };

  const handleEditItem = (id: string) => {
    // Find the item to edit
    const itemToEdit = budgetItems.find((item) => item.id === id);
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEditedItem = (id: string, category: string, cost: number) => {
    setBudgetItems(
      budgetItems.map((item) =>
        item.id === id ? { ...item, name: category, cost: cost } : item
      )
    );
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    // Show confirmation dialog in real app, for now just delete
    setBudgetItems(budgetItems.filter((item) => item.id !== id));
  };

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
      </div>

      {/* Monthly Income and Budget Allocation - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-lg mr-2">$</span>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) =>
                  setMonthlyIncome(parseFloat(e.target.value) || 0)
                }
                className="text-lg font-medium"
                placeholder="1500"
              />
            </div>
          </CardContent>
        </Card>

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
                  {monthlyIncome.toLocaleString()}
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
                    {selectedCategory || 'Select category'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
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

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4">
        <Button
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-12"
          size="lg"
        >
          Save & Start Tracking
        </Button>
        <Button variant="outline" className="flex-1 h-12" size="lg">
          <Send className="h-4 w-4 mr-2" />
          Send to Telegram
        </Button>
      </div>

      {/* Edit Budget Item Dialog */}
      <EditBudgetItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleSaveEditedItem}
        categories={categories}
      />
    </div>
  );
}
