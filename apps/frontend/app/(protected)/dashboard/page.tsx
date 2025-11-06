'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeroCard } from '@/components/common/DashboardHeroCard';
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

export default function DashboardPage() {
  const { user } = useAuth();

  // Month selection state
  const months = [
    { value: '2025-01', label: 'January 2025' },
    { value: '2025-02', label: 'February 2025' },
    { value: '2025-03', label: 'March 2025' },
    { value: '2025-04', label: 'April 2025' },
    { value: '2025-05', label: 'May 2025' },
    { value: '2025-06', label: 'June 2025' },
    { value: '2025-07', label: 'July 2025' },
    { value: '2025-08', label: 'August 2025' },
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-10', label: 'October 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-12', label: 'December 2025' },
  ];

  const [selectedMonth, setSelectedMonth] = useState('2025-10'); // Default to October 2025
  const currentMonthLabel =
    months.find((month) => month.value === selectedMonth)?.label ||
    'October 2025';

  // Sample data for charts
  const spendingData = [
    { name: 'Food & Dining', value: 847, percentage: 51, color: '#1f2937' },
    { name: 'Transportation', value: 381, percentage: 23, color: '#6b7280' },
    { name: 'Entertainment', value: 265, percentage: 16, color: '#9ca3af' },
    { name: 'Bills & Utilities', value: 0, percentage: 0, color: '#d1d5db' },
  ];

  const monthlyData = [
    { month: 'Jul', amount: 850 },
    { month: 'Aug', amount: 920 },
    { month: 'Sep', amount: 780 },
    { month: 'Oct', amount: 150 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-500 hidden md:block">
            {currentMonthLabel}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right md:hidden">
            <p className="text-sm text-gray-500">{currentMonthLabel}</p>
          </div>
          {/* Month Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {currentMonthLabel}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.value}
                  onClick={() => setSelectedMonth(month.value)}
                  className={`cursor-pointer ${
                    selectedMonth === month.value
                      ? 'bg-gray-100 font-medium'
                      : ''
                  }`}
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero Card */}
      <DashboardHeroCard
        title="Monthly Budget"
        amount="$152.3"
        totalBudget="$1,000"
        remaining="$847.7 remaining"
        percentage={15}
        className="col-span-full"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardStatCard
          title="Daily Average"
          value="$76"
          icon={DollarSign}
        />
        <DashboardStatCard title="Transactions" value="5" icon={Receipt} />
        <DashboardStatCard
          title="Top Category"
          value="Food & Dining"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <DashboardChartCard title="Spending by Category">
          <SpendingPieChart data={spendingData} />
        </DashboardChartCard>

        {/* Monthly Trend */}
        <DashboardChartCard title="Monthly Trend">
          <MonthlyTrendChart data={monthlyData} />
        </DashboardChartCard>
      </div>
    </div>
  );
}
