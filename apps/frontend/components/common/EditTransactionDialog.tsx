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

interface Transaction {
  id: string;
  itemName: string;
  amount: number;
  category: string;
  date: string;
  time: string;
}

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: (
    id: string,
    itemName: string,
    amount: number,
    category: string
  ) => void;
  categories: string[];
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSave,
  categories,
}: EditTransactionDialogProps) {
  const [itemName, setItemName] = useState<string>(transaction?.itemName || '');
  const [amount, setAmount] = useState<string>(
    transaction?.amount.toString() || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    transaction?.category || ''
  );

  // Update form values when transaction changes
  const updateFormValues = () => {
    if (transaction) {
      setItemName(transaction.itemName);
      setAmount(transaction.amount.toString());
      setSelectedCategory(transaction.category);
    }
  };

  // Call updateFormValues when dialog opens
  if (
    open &&
    transaction &&
    (itemName !== transaction.itemName ||
      amount !== transaction.amount.toString() ||
      selectedCategory !== transaction.category)
  ) {
    updateFormValues();
  }

  const handleSave = () => {
    if (transaction && itemName && amount && selectedCategory) {
      onSave(transaction.id, itemName, parseFloat(amount), selectedCategory);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Item Name Input */}
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Grocery Shopping"
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45.5"
                className="pl-8"
                step="0.01"
              />
            </div>
          </div>

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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!itemName || !amount || !selectedCategory}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
