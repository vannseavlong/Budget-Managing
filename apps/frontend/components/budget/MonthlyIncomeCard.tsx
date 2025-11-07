'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import BudgetsService from '@/lib/budgets-service';
import { useToast } from '@/hooks/useToast';

interface Budget {
  id: string;
  year: number;
  month: number;
  income: number;
}

interface MonthlyIncomeCardProps {
  selectedMonth: string; // YYYY-MM format
  onIncomeChange?: () => void;
}

export function MonthlyIncomeCard({
  selectedMonth,
  onIncomeChange,
}: MonthlyIncomeCardProps) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [date, setDate] = useState<Date>();
  const [income, setIncome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadBudget = async () => {
    if (!selectedMonth) return;

    const [year, month] = selectedMonth.split('-').map(Number);

    try {
      setIsLoading(true);
      const budgets = await BudgetsService.getBudgets({ year, month });
      if (budgets && budgets.length > 0) {
        setBudget(budgets[0]);
        setIncome(String(budgets[0].income || ''));
        setDate(new Date(budgets[0].year, budgets[0].month - 1, 1));
      } else {
        setBudget(null);
        setIncome('');
        setDate(new Date(year, month - 1, 1));
      }
    } catch (error: any) {
      console.error('Failed to load budget:', error);
      setBudget(null);
      setIncome('');
      setDate(new Date(year, month - 1, 1));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [selectedMonth]);

  const handleSaveOrUpdate = async () => {
    const parsedIncome = parseFloat(income);
    if (!date || isNaN(parsedIncome) || parsedIncome < 0) {
      toast({
        title: 'Please select a month and enter a valid income amount',
        variant: 'destructive',
      });
      return;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
      if (budget) {
        // Update existing budget
        await BudgetsService.updateBudget(budget.id, { income: parsedIncome });
        toast({ title: 'Income updated' });
      } else {
        // Create new budget
        await BudgetsService.createBudget({
          year,
          month,
          income: parsedIncome,
        });
        toast({ title: 'Income saved' });
      }

      await loadBudget();
      onIncomeChange?.();
    } catch (error: any) {
      toast({
        title: 'Failed to save income',
        description: error?.message || String(error),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!budget) return;

    if (!confirm('Are you sure you want to delete this income entry?')) {
      return;
    }

    try {
      await BudgetsService.deleteBudget(budget.id);
      toast({ title: 'Income deleted' });
      setBudget(null);
      setIncome('');
      onIncomeChange?.();
    } catch (error: any) {
      toast({
        title: 'Failed to delete income',
        description: error?.message || String(error),
        variant: 'destructive',
      });
    }
  };

  // Auto-save on blur
  const handleBlur = () => {
    if (income && income !== String(budget?.income || '')) {
      handleSaveOrUpdate();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          💰 Monthly Income
        </CardTitle>
        {budget && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSaveOrUpdate}>
                <Pencil className="h-4 w-4 mr-2" />
                Update
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        ) : (
          <>
            {/* Month Picker */}
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'MMMM yyyy') : 'Pick a month'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      if (newDate) {
                        const year = newDate.getFullYear();
                        const month = newDate.getMonth() + 1;
                        // Auto-load budget for the new month
                        BudgetsService.getBudgets({ year, month }).then(
                          (budgets) => {
                            if (budgets && budgets.length > 0) {
                              setBudget(budgets[0]);
                              setIncome(String(budgets[0].income || ''));
                            } else {
                              setBudget(null);
                              setIncome('');
                            }
                          }
                        );
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Income Amount */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Income Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  $
                </span>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="0"
                  className="pl-7 text-lg"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
