'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { goalProgress } from '@/lib/transaction-stats';
import type { GoalPeriod } from '@/types/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  ChevronDown,
  Plus,
  Target,
  TrendingUp,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import { EditGoalDialog } from '@/components/common/EditGoalDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface UiGoal {
  id: string;
  name: string;
  type: 'Daily Spending Limit' | 'Weekly Budget' | 'Monthly Budget' | 'Savings Goal';
  currentAmount: number;
  limitAmount: number;
  period: 'Daily' | 'Weekly' | 'Monthly';
  telegramAlertsEnabled: boolean;
  alertThresholds: number[];
  status: 'Over Budget' | 'On Track' | 'Under Budget';
  exceeded?: boolean;
  goalType: 'Daily Goal' | 'Weekly Goal' | 'Monthly Goal';
}

const PERIOD_LABEL: Record<GoalPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function GoalsPage() {
  const { user } = useAuth();
  const {
    goals: apiGoals,
    loading: goalsLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
  } = useGoals();
  const { transactions: apiTransactions, loading: transactionsLoading } =
    useTransactions();

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalPeriod, setNewGoalPeriod] = useState('Daily');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UiGoal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const goals = useMemo<UiGoal[]>(
    () =>
      apiGoals.map((goal) => {
        const { currentAmount, exceeded } = goalProgress(goal, apiTransactions);
        const periodLabel = PERIOD_LABEL[goal.period] as UiGoal['period'];
        return {
          id: goal.id,
          name: goal.name,
          type: `${periodLabel} Budget` as UiGoal['type'],
          currentAmount,
          limitAmount: goal.limit_amount,
          period: periodLabel,
          telegramAlertsEnabled: goal.notify_telegram,
          alertThresholds: [80, 100],
          status: exceeded ? 'Over Budget' : 'On Track',
          exceeded,
          goalType: `${periodLabel} Goal` as UiGoal['goalType'],
        };
      }),
    [apiGoals, apiTransactions]
  );

  const calculateProgress = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim() || !newGoalAmount || !newGoalPeriod) return;

    setIsSubmitting(true);
    try {
      await createGoal({
        name: newGoalName.trim(),
        limit_amount: parseFloat(newGoalAmount),
        period: newGoalPeriod.toLowerCase() as GoalPeriod,
        notify_telegram: false,
      });
      setNewGoalName('');
      setNewGoalAmount('');
      setNewGoalPeriod('Daily');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTelegramAlerts = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    try {
      await updateGoal(goalId, { notify_telegram: !goal.telegramAlertsEnabled });
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleEditGoal = (goal: UiGoal) => {
    setEditingGoal(goal);
    setIsEditDialogOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await deleteGoal(goalId);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleSaveEditedGoal = async (
    id: string,
    name: string,
    limitAmount: number,
    period: string
  ) => {
    try {
      await updateGoal(id, {
        name,
        limit_amount: limitAmount,
        period: period.toLowerCase() as GoalPeriod,
      });
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setIsEditDialogOpen(false);
      setEditingGoal(null);
    }
  };

  const loading = goalsLoading || transactionsLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Set spending limits and get notified when you&apos;re close
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg text-sm text-gray-600">
          No goals yet — add one below to start tracking a spending limit.
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(
              goal.currentAmount,
              goal.limitAmount
            );
            const amountLeft = goal.limitAmount - goal.currentAmount;

            return (
              <Card key={goal.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {goal.goalType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {goal.exceeded && (
                        <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Over Budget
                        </div>
                      )}
                      {!goal.exceeded && goal.status === 'On Track' && (
                        <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                          <TrendingUp className="h-3 w-3" />
                          On Track
                        </div>
                      )}

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditGoal(goal)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="cursor-pointer text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Amount Display */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      ${goal.currentAmount.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      / ${goal.limitAmount.toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {amountLeft > 0
                        ? `$${amountLeft.toFixed(2)} left`
                        : `$${Math.abs(amountLeft).toFixed(2)} over`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {progress.toFixed(0)}% of {goal.period.toLowerCase()}{' '}
                        limit used
                      </span>
                    </div>
                  </div>

                  {/* Telegram Alerts */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telegram Alerts</p>
                        <p className="text-xs text-muted-foreground">
                          Notify at {goal.alertThresholds.join('% and ')}%
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={goal.telegramAlertsEnabled}
                      onCheckedChange={() => toggleTelegramAlerts(goal.id)}
                    />
                  </div>

                  {/* Exceeded Warning */}
                  {goal.exceeded && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-gray-600" />
                      <p className="text-sm text-gray-700">
                        You&apos;ve exceeded your {goal.period.toLowerCase()}{' '}
                        limit!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New Goal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input
                    id="goalName"
                    placeholder="e.g., Coffee Budget"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limitAmount">Limit Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="limitAmount"
                      type="number"
                      placeholder="0.00"
                      value={newGoalAmount}
                      onChange={(e) => setNewGoalAmount(e.target.value)}
                      className="pl-8"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Period</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {newGoalPeriod}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setNewGoalPeriod('Daily')}
                      >
                        Daily
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setNewGoalPeriod('Weekly')}
                      >
                        Weekly
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setNewGoalPeriod('Monthly')}
                      >
                        Monthly
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddGoal}
                  className="flex-1"
                  disabled={isSubmitting || !newGoalName.trim() || !newGoalAmount}
                >
                  Create Goal
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewGoalName('');
                    setNewGoalAmount('');
                    setNewGoalPeriod('Daily');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Goal Dialog */}
      <EditGoalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        goal={editingGoal}
        onSave={handleSaveEditedGoal}
      />
    </div>
  );
}
