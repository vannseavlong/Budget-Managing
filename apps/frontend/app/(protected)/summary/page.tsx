'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Download,
  Send,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  FileText,
  Info,
} from 'lucide-react';

interface Transaction {
  id: string;
  itemName: string;
  amount: number;
  category: string;
  date: string;
  time: string;
}

interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    itemName: 'Grocery Shopping',
    amount: 45.5,
    category: 'Food & Dining',
    date: '11/05',
    time: '09:30 AM',
  },
  {
    id: '2',
    itemName: 'Coffee Shop',
    amount: 5.5,
    category: 'Food & Dining',
    date: '11/05',
    time: '02:45 PM',
  },
  {
    id: '3',
    itemName: 'Movie Tickets',
    amount: 24.0,
    category: 'Entertainment',
    date: '11/04',
    time: '07:30 PM',
  },
  {
    id: '4',
    itemName: 'Restaurant',
    amount: 42.3,
    category: 'Food & Dining',
    date: '11/04',
    time: '06:15 PM',
  },
];

const categorySpending: CategorySpending[] = [
  {
    name: 'Food & Dining',
    amount: 93.3,
    percentage: 79.5,
    color: '#FF5722',
  },
  {
    name: 'Entertainment',
    amount: 24.0,
    percentage: 20.5,
    color: '#E91E63',
  },
];

export default function SummaryPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('November 2025');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination logic
  const totalTransactions = sampleTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sampleTransactions.slice(startIndex, endIndex);

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleSendToTelegram = () => {
    console.log('Sending to Telegram...');
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
            Detailed breakdown of your spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {selectedPeriod}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => setSelectedPeriod('November 2025')}
              >
                November 2025
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedPeriod('October 2025')}
              >
                October 2025
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedPeriod('September 2025')}
              >
                September 2025
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$117.30</div>
            <p className="text-xs text-muted-foreground">11.7% of budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$882.70</div>
            <p className="text-xs text-muted-foreground">Under budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$58.65</div>
            <p className="text-xs text-muted-foreground">2 active days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">vs Last Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">↗ 17.6%</div>
            <p className="text-xs text-muted-foreground">Increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Top Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categorySpending.map((category, index) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    ${category.amount.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({category.percentage}%)
                  </span>
                </div>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Transactions ({totalTransactions})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleSendToTelegram}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              Send to Telegram
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 py-3 border-b font-medium text-sm">
            <div className="col-span-3">Item Name</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Time</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-12 gap-4 py-3 items-center"
              >
                <div className="col-span-3 font-medium">
                  {transaction.itemName}
                </div>
                <div className="col-span-2 font-semibold">
                  ${transaction.amount.toFixed(2)}
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {transaction.category}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {transaction.date}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {transaction.time}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{' '}
                {Math.min(endIndex, totalTransactions)} of {totalTransactions}{' '}
                transactions
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

      {/* Automatic Telegram Report */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                Automatic Telegram Report
              </h3>
              <p className="text-sm text-blue-700">
                Your monthly summary will be automatically sent to Telegram on
                the last day of each month if you haven&apos;t already sent it
                manually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending Insights */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-green-900 mb-1">
                Spending Insights
              </h3>
              <p className="text-sm text-green-700">
                Great job! You&apos;re only using 11.7% of your budget. Keep it
                up! Your biggest expense is Food & Dining at $93.30. Your
                spending increased by 17.6% compared to last month.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
