'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import BudgetsService from '@/lib/budgets-service';

interface MonthSelectorProps {
  value?: string; // YYYY-MM format
  onChange: (value: string) => void;
  className?: string;
}

interface Budget {
  id: string;
  year: number;
  month: number;
  income: number;
}

export function MonthSelector({
  value,
  onChange,
  className,
}: MonthSelectorProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(value || '');

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (value) {
      setSelectedMonth(value);
    }
  }, [value]);

  const loadBudgets = async () => {
    try {
      const allBudgets = await BudgetsService.getBudgets({});
      setBudgets(allBudgets);

      // If no value provided and budgets exist, select the most recent one
      if (!value && allBudgets.length > 0) {
        const sorted = [...allBudgets].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        const latest = sorted[0];
        const monthValue = `${latest.year}-${String(latest.month).padStart(2, '0')}`;
        setSelectedMonth(monthValue);
        onChange(monthValue);
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  };

  const getMonthLabel = (budget: Budget) => {
    const date = new Date(budget.year, budget.month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getCurrentLabel = () => {
    if (!selectedMonth) return 'Select Month';
    const [year, month] = selectedMonth.split('-').map(Number);
    const budget = budgets.find((b) => b.year === year && b.month === month);
    return budget ? getMonthLabel(budget) : 'Select Month';
  };

  const handleSelect = (budget: Budget) => {
    const monthValue = `${budget.year}-${String(budget.month).padStart(2, '0')}`;
    setSelectedMonth(monthValue);
    onChange(monthValue);
  };

  // Sort budgets by year and month (most recent first)
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  if (budgets.length === 0) {
    return (
      <Button variant="outline" className={className} disabled>
        No budgets yet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
        >
          {getCurrentLabel()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {sortedBudgets.map((budget) => {
          const monthValue = `${budget.year}-${String(budget.month).padStart(2, '0')}`;
          return (
            <DropdownMenuItem
              key={budget.id}
              onClick={() => handleSelect(budget)}
              className={`cursor-pointer ${
                selectedMonth === monthValue ? 'bg-gray-100 font-medium' : ''
              }`}
            >
              {getMonthLabel(budget)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
