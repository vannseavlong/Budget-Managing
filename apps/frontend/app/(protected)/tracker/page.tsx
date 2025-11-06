'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { TransactionTable } from '@/components/common/TransactionTable';
import { EditTransactionDialog } from '@/components/common/EditTransactionDialog';

interface Transaction {
  id: string;
  itemName: string;
  amount: number;
  category: string;
  date: string;
  time: string;
}

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    itemName: 'Morning Coffee',
    amount: 4.5,
    category: 'Food & Drink',
    date: '2024-01-15',
    time: '08:30 AM',
  },
  {
    id: '2',
    itemName: 'Gas Station',
    amount: 45.0,
    category: 'Transportation',
    date: '2024-01-15',
    time: '07:15 AM',
  },
  {
    id: '3',
    itemName: 'Lunch at Subway',
    amount: 12.99,
    category: 'Food & Drink',
    date: '2024-01-15',
    time: '12:30 PM',
  },
  {
    id: '4',
    itemName: 'Grocery Shopping',
    amount: 67.89,
    category: 'Shopping',
    date: '2024-01-14',
    time: '06:45 PM',
  },
  {
    id: '5',
    itemName: 'Movie Tickets',
    amount: 24.0,
    category: 'Entertainment',
    date: '2024-01-14',
    time: '07:30 PM',
  },
  {
    id: '6',
    itemName: 'Uber Ride',
    amount: 18.75,
    category: 'Transportation',
    date: '2024-01-13',
    time: '09:15 PM',
  },
  {
    id: '7',
    itemName: 'Dinner',
    amount: 32.5,
    category: 'Food & Drink',
    date: '2024-01-13',
    time: '07:00 PM',
  },
  {
    id: '8',
    itemName: 'Electric Bill',
    amount: 89.99,
    category: 'Bills & Utilities',
    date: '2024-01-12',
    time: '10:00 AM',
  },
];

export default function TrackerPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] =
    useState<Transaction[]>(sampleTransactions);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Select Category');
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const categories = [
    'Food & Drink',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
  ];

  // Calculate totals
  const today = '2024-01-15';
  const todayTransactions = transactions.filter((t) => t.date === today);
  const todayTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

  const thisWeekTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const currentDate = new Date(today);
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    return transactionDate >= weekStart;
  });
  const thisWeekTotal = thisWeekTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const allTimeTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = () => {
    if (itemName.trim() && amount && category !== 'Select Category') {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        itemName: itemName.trim(),
        amount: parseFloat(amount),
        category,
        date: today,
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };

      setTransactions([newTransaction, ...transactions]);

      // Reset form
      setItemName('');
      setAmount('');
      setCategory('Select Category');
    }
  };

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleSaveTransaction = (
    id: string,
    itemName: string,
    amount: number,
    category: string
  ) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, itemName, amount, category } : t
      )
    );
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
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
            Track and manage your daily expenses
          </p>
        </div>
      </div>

      {/* Summary Cards */}
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
            <div className="flex items-center space-x-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+$4.50</span>
              <span className="text-muted-foreground">from yesterday</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {todayTransactions.length} transaction
              {todayTransactions.length !== 1 ? 's' : ''} today
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
            <div className="flex items-center space-x-1 text-xs">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-$12.30</span>
              <span className="text-muted-foreground">from last week</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {thisWeekTransactions.length} transaction
              {thisWeekTransactions.length !== 1 ? 's' : ''} this week
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
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-muted-foreground">
                Total expenses tracked
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {transactions.length} total transaction
              {transactions.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                onClick={handleAddTransaction}
                className="w-full"
                disabled={
                  !itemName.trim() || !amount || category === 'Select Category'
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
            categories={categories}
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
        categories={categories}
      />
    </div>
  );
}
