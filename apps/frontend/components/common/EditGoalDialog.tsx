'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  type:
    | 'Daily Spending Limit'
    | 'Weekly Budget'
    | 'Monthly Budget'
    | 'Savings Goal';
  currentAmount: number;
  limitAmount: number;
  period: 'Daily' | 'Weekly' | 'Monthly';
  telegramAlertsEnabled: boolean;
  alertThresholds: number[];
  status: 'Over Budget' | 'On Track' | 'Under Budget';
  exceeded?: boolean;
  goalType: 'Daily Goal' | 'Weekly Goal' | 'Monthly Goal';
}

interface EditGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onSave: (
    id: string,
    name: string,
    limitAmount: number,
    period: string
  ) => void;
}

export function EditGoalDialog({
  open,
  onOpenChange,
  goal,
  onSave,
}: EditGoalDialogProps) {
  const [goalName, setGoalName] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Daily');

  const periods = ['Daily', 'Weekly', 'Monthly'];

  // Update form when goal prop changes
  if (
    open &&
    goal &&
    (goalName !== goal.name ||
      limitAmount !== goal.limitAmount.toString() ||
      selectedPeriod !== goal.period)
  ) {
    setGoalName(goal.name);
    setLimitAmount(goal.limitAmount.toString());
    setSelectedPeriod(goal.period);
  }

  const handleSave = () => {
    if (goal && goalName.trim() && limitAmount && selectedPeriod) {
      onSave(goal.id, goalName.trim(), parseFloat(limitAmount), selectedPeriod);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>Update your goal details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="goalName">Goal Name</Label>
            <Input
              id="goalName"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Enter goal name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="limitAmount">Limit Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="limitAmount"
                type="number"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Period</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedPeriod}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {periods.map((period) => (
                  <DropdownMenuItem
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!goalName.trim() || !limitAmount || !selectedPeriod}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
