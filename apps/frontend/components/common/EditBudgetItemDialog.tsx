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

interface BudgetItem {
  id: string;
  name: string;
  cost: number;
  status: 'Spent' | 'Not Yet';
}

interface EditBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetItem | null;
  onSave: (id: string, category: string, cost: number) => void;
  categories: string[];
}

export function EditBudgetItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  categories,
}: EditBudgetItemDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    item?.name || ''
  );
  const [expectedCost, setExpectedCost] = useState<string>(
    item?.cost.toString() || ''
  );

  // Update form values when item changes
  const updateFormValues = () => {
    if (item) {
      setSelectedCategory(item.name);
      setExpectedCost(item.cost.toString());
    }
  };

  // Call updateFormValues when dialog opens
  if (
    open &&
    item &&
    (selectedCategory !== item.name || expectedCost !== item.cost.toString())
  ) {
    updateFormValues();
  }

  const handleSave = () => {
    if (item && selectedCategory && expectedCost) {
      onSave(item.id, selectedCategory, parseFloat(expectedCost));
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Budget Item</DialogTitle>
          <DialogDescription>
            Update the category and expected cost for this budget item.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  id="category"
                >
                  {selectedCategory || 'Select category'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expected Cost Input */}
          <div className="space-y-2">
            <Label htmlFor="cost">Expected Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="cost"
                type="number"
                value={expectedCost}
                onChange={(e) => setExpectedCost(e.target.value)}
                placeholder="400"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedCategory || !expectedCost}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
