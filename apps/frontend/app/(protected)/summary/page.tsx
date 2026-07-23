'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import {
  transactionsInMonth,
  totalAmount,
  categoryBreakdown,
  monthOptions,
} from '@/lib/transaction-stats';
import BudgetsService from '@/lib/budgets-service';
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
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  FileText,
  Info,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS = [
  '#FF5722',
  '#E91E63',
  '#3F51B5',
  '#009688',
  '#FFC107',
  '#795548',
];

export default function SummaryPage() {
  const { user } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();

  const options = useMemo(() => monthOptions(12), []);
  const [selected, setSelected] = useState(options[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [incomeSum, setIncomeSum] = useState<number | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    BudgetsService.getIncomeSum(selected.year, selected.month)
      .then((sum) => {
        if (!cancelled) setIncomeSum(sum);
      })
      .catch(() => {
        if (!cancelled) setIncomeSum(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected.year, selected.month]);

  const monthTransactions = useMemo(
    () => transactionsInMonth(transactions, selected.year, selected.month),
    [transactions, selected]
  );

  const lastMonthTotal = useMemo(() => {
    const prev = new Date(selected.year, selected.month - 2, 1);
    return totalAmount(
      transactionsInMonth(transactions, prev.getFullYear(), prev.getMonth() + 1)
    );
  }, [transactions, selected]);

  const totalSpent = totalAmount(monthTransactions);
  const activeDays = new Set(
    monthTransactions.map((t) => new Date(t.date).toDateString())
  ).size;
  const dailyAverage = activeDays > 0 ? totalSpent / activeDays : 0;
  const vsLastMonthPct =
    lastMonthTotal > 0
      ? ((totalSpent - lastMonthTotal) / lastMonthTotal) * 100
      : totalSpent > 0
        ? 100
        : 0;

  const hasBudget = incomeSum !== null && incomeSum > 0;
  const remaining = hasBudget ? (incomeSum as number) - totalSpent : null;
  const percentOfBudget = hasBudget
    ? (totalSpent / (incomeSum as number)) * 100
    : null;

  const categories = categoryBreakdown(monthTransactions).slice(0, 5);

  const totalTransactions = monthTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = monthTransactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(startIndex, endIndex);

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleSendToTelegram = () => {
    console.log('Sending to Telegram...');
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  const loading = transactionsLoading;

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
                {selected.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {options.map((opt) => (
                <DropdownMenuItem
                  key={`${opt.year}-${opt.month}`}
                  onClick={() => {
                    setSelected(opt);
                    setCurrentPage(1);
                  }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {percentOfBudget !== null
                  ? `${percentOfBudget.toFixed(1)}% of budget`
                  : 'No budget set for this month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${remaining !== null && remaining < 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {remaining !== null ? `$${remaining.toFixed(2)}` : '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                {remaining === null
                  ? 'Set an income for this month to track this'
                  : remaining < 0
                    ? 'Over budget'
                    : 'Under budget'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dailyAverage.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {activeDays} active day{activeDays !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">vs Last Month</CardTitle>
              {vsLastMonthPct >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${vsLastMonthPct >= 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {vsLastMonthPct >= 0 ? '↗' : '↘'} {Math.abs(vsLastMonthPct).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {vsLastMonthPct >= 0 ? 'Increase' : 'Decrease'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Top Spending Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No spending recorded for {selected.label}.
            </p>
          ) : (
            categories.map((category, index) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                      }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      ${category.amount.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))
          )}
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
            {currentTransactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No transactions for {selected.label}.
              </div>
            ) : (
              currentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-12 gap-4 py-3 items-center"
                >
                  <div className="col-span-3 font-medium">
                    {transaction.name}
                  </div>
                  <div className="col-span-2 font-semibold">
                    ${transaction.amount.toFixed(2)}
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    {transaction.category_name || 'Uncategorized'}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {transaction.time ||
                      new Date(transaction.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </div>
                </div>
              ))
            )}
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
      {!loading && totalSpent > 0 && (
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
                  {percentOfBudget !== null &&
                    `You're using ${percentOfBudget.toFixed(1)}% of your budget. `}
                  {categories[0] &&
                    `Your biggest expense is ${categories[0].name} at $${categories[0].amount.toFixed(2)}. `}
                  Your spending {vsLastMonthPct >= 0 ? 'increased' : 'decreased'}{' '}
                  by {Math.abs(vsLastMonthPct).toFixed(1)}% compared to last
                  month.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
