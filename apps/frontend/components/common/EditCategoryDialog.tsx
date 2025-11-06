'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
  emoji: string;
  color?: string; // Keep for backward compatibility
  created: string;
  usage: string;
  transactionCount: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (id: string, name: string, emoji: string) => void;
  isLoading?: boolean;
}

const emojiOptions = [
  '🍽️', // Food & Dining
  '🚗', // Transportation
  '💡', // Bills & Utilities
  '🛍️', // Shopping
  '🎬', // Entertainment
  '🏥', // Healthcare
  '📚', // Education
  '💰', // Finance
  '🏠', // Home
  '✈️', // Travel
  '🎯', // Goals
  '📂', // Other
  '💳', // Credit Card
  '⛽', // Gas
  '📱', // Technology
  '🎮', // Gaming
  '🏋️', // Fitness
  '🐕', // Pets
  '🎵', // Music
  '👕', // Clothing
  '🚌', // Public Transport
  '🍕', // Fast Food
  '☕', // Coffee
  '📊', // Business
];

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
  isLoading = false,
}: EditCategoryDialogProps) {
  // Initialize state with current category values
  const [categoryName, setCategoryName] = useState<string>(
    category?.name || ''
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string>(
    category?.emoji || emojiOptions[0]
  );

  const handleSave = () => {
    if (category && categoryName.trim()) {
      onSave(category.id, categoryName.trim(), selectedEmoji);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={category?.id} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Category
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update your category details
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="categoryName" className="text-sm font-medium">
              Category Name
            </Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full"
            />
          </div>

          {/* Emoji Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Emoji</Label>
            <div className="grid grid-cols-6 gap-3">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center text-lg ${
                    selectedEmoji === emoji
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  aria-label={`Select emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!categoryName.trim() || isLoading}
            className="flex-1 bg-black hover:bg-gray-800 text-white"
          >
            {isLoading ? 'Updating...' : 'Update Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
