'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { startOfPeriod, sumSince } from '@/lib/transaction-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Plus,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { TransactionTable } from '@/components/common/TransactionTable';
import { EditTransactionDialog } from '@/components/common/EditTransactionDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface UiTransaction {
  id: string;
  itemName: string;
  amount: number;
  category: string;
  date: string;
  time: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

function formatTime(iso: string, fallback?: string): string {
  if (fallback) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function TrackerPage() {
  const { user } = useAuth();
  const { categories: apiCategories, loading: categoriesLoading } =
    useCategories();
  const {
    transactions: apiTransactions,
    loading: transactionsLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Select Category');
  const [editingTransaction, setEditingTransaction] =
    useState<UiTransaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryNames = useMemo(
    () => apiCategories.map((c) => c.name),
    [apiCategories]
  );

  const categoryIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of apiCategories) map.set(c.name, c.id);
    return map;
  }, [apiCategories]);

  const transactions = useMemo<UiTransaction[]>(
    () =>
      apiTransactions.map((t) => ({
        id: t.id,
        itemName: t.name,
        amount: t.amount,
        category: t.category_name || 'Uncategorized',
        date: formatDate(t.date),
        time: formatTime(t.date, t.time),
      })),
    [apiTransactions]
  );

  const todayTotal = sumSince(apiTransactions, startOfPeriod('daily', new Date()));
  const todayCount = apiTransactions.filter(
    (t) => new Date(t.date) >= startOfPeriod('daily', new Date())
  ).length;

  const thisWeekTotal = sumSince(
    apiTransactions,
    startOfPeriod('weekly', new Date())
  );
  const thisWeekCount = apiTransactions.filter(
    (t) => new Date(t.date) >= startOfPeriod('weekly', new Date())
  ).length;

  const allTimeTotal = apiTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = async () => {
    if (!itemName.trim() || !amount || category === 'Select Category') return;

    const categoryId = categoryIdByName.get(category);
    if (!categoryId) return;

    setIsSubmitting(true);
    try {
      await createTransaction({
        name: itemName.trim(),
        amount: parseFloat(amount),
        category_id: categoryId,
        category_name: category,
        date: new Date().toISOString(),
      });
      setItemName('');
      setAmount('');
      setCategory('Select Category');
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleSaveTransaction = async (
    id: string,
    newItemName: string,
    newAmount: number,
    newCategory: string
  ) => {
    const categoryId = categoryIdByName.get(newCategory);
    try {
      await updateTransaction(id, {
        name: newItemName,
        amount: newAmount,
        category_id: categoryId,
        category_name: newCategory,
      });
    } catch (err) {
      console.error('Failed to update transaction:', err);
    } finally {
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
    }
  };

  const loading = transactionsLoading || categoriesLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your daily expenses
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today&apos;s Total
              </CardTitle>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todayTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {todayCount} transaction{todayCount !== 1 ? 's' : ''} today
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${thisWeekTotal.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {thisWeekCount} transaction{thisWeekCount !== 1 ? 's' : ''} this
                week
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Time</CardTitle>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${allTimeTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {apiTransactions.length} total transaction
                {apiTransactions.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add New Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="itemName" className="text-sm font-medium">
                Item Name
              </label>
              <Input
                id="itemName"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {category}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {categoryNames.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No categories yet — add one first
                    </DropdownMenuItem>
                  ) : (
                    categoryNames.map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                onClick={handleAddTransaction}
                className="w-full"
                disabled={
                  isSubmitting ||
                  !itemName.trim() ||
                  !amount ||
                  category === 'Select Category'
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            categories={categoryNames}
            pageSize={10}
            searchable={true}
            filterable={true}
          />
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categoryNames}
      />
    </div>
  );
}
