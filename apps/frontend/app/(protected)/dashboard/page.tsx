'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useTransactions } from '@/hooks/useTransactions';
import {
  transactionsInMonth,
  totalAmount,
  categoryBreakdown,
  monthlyTrend,
  monthOptions,
} from '@/lib/transaction-stats';
import BudgetsService from '@/lib/budgets-service';
import { DashboardHeroCard } from '@/components/common/DashboardHeroCard';
import { DashboardSkeleton } from '@/components/common/DashboardSkeleton';
import { DashboardStatCard } from '@/components/common/DashboardStatCard';
import { DashboardChartCard } from '@/components/common/DashboardChartCard';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { DollarSign, Receipt, TrendingUp, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const CATEGORY_COLORS = [
  '#1f2937',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
  '#e5e7eb',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { isLoading } = useProtectedRoute();
  const { transactions, loading: transactionsLoading } = useTransactions();

  const options = useMemo(() => monthOptions(12), []);
  const [selected, setSelected] = useState(options[0]);
  const [incomeSum, setIncomeSum] = useState<number | null>(null);

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

  const totalSpent = totalAmount(monthTransactions);
  const activeDays = new Set(
    monthTransactions.map((t) => new Date(t.date).toDateString())
  ).size;
  const dailyAverage = activeDays > 0 ? totalSpent / activeDays : 0;

  const breakdown = categoryBreakdown(monthTransactions).slice(0, 4);
  const spendingData = breakdown.map((entry, index) => ({
    name: entry.name,
    value: entry.amount,
    percentage: Math.round(entry.percentage),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const monthlyData = monthlyTrend(transactions, 4);

  const hasBudget = incomeSum !== null && incomeSum > 0;
  const remaining = hasBudget ? (incomeSum as number) - totalSpent : null;
  const percentage = hasBudget
    ? Math.min((totalSpent / (incomeSum as number)) * 100, 100)
    : 0;

  // Show a layout-shaped skeleton while checking authentication instead of
  // a blank spinner — avoids a jarring blank-then-content flash.
  if (isLoading || transactionsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-500 hidden md:block">
            {selected.label}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right md:hidden">
            <p className="text-sm text-gray-500">{selected.label}</p>
          </div>
          {/* Month Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {selected.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {options.map((opt) => (
                <DropdownMenuItem
                  key={`${opt.year}-${opt.month}`}
                  onClick={() => setSelected(opt)}
                  className={`cursor-pointer ${
                    selected.year === opt.year && selected.month === opt.month
                      ? 'bg-gray-100 font-medium'
                      : ''
                  }`}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero Card */}
      <DashboardHeroCard
        title="Monthly Budget"
        amount={`$${totalSpent.toFixed(2)}`}
        totalBudget={hasBudget ? `$${(incomeSum as number).toFixed(0)}` : 'Not set'}
        remaining={
          remaining !== null
            ? `$${Math.abs(remaining).toFixed(2)} ${remaining < 0 ? 'over' : 'remaining'}`
            : 'Set an income for this month to track this'
        }
        percentage={Math.round(percentage)}
        className="col-span-full"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardStatCard
          title="Daily Average"
          value={`$${dailyAverage.toFixed(0)}`}
          icon={DollarSign}
        />
        <DashboardStatCard
          title="Transactions"
          value={monthTransactions.length}
          icon={Receipt}
        />
        <DashboardStatCard
          title="Top Category"
          value={breakdown[0]?.name || 'None yet'}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <DashboardChartCard title="Spending by Category">
          {spendingData.length === 0 ? (
            <div className="h-70 md:h-80 flex items-center justify-center text-sm text-muted-foreground">
              No spending recorded for {selected.label}.
            </div>
          ) : (
            <SpendingPieChart data={spendingData} />
          )}
        </DashboardChartCard>

        {/* Monthly Trend */}
        <DashboardChartCard title="Monthly Trend">
          <MonthlyTrendChart data={monthlyData} />
        </DashboardChartCard>
      </div>
    </div>
  );
}
