'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import httpClient from '@/lib/http-client';

interface Budget {
  id: string;
  year: number;
  month: number;
  income: number;
}

interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
}

interface SendToTelegramButtonProps {
  budget: Budget | null;
  budgetItems: BudgetItem[];
}

export function SendToTelegramButton({
  budget,
  budgetItems,
}: SendToTelegramButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const formatBudgetMessage = (
    budget: Budget,
    budgetItems: BudgetItem[]
  ): string => {
    const month = new Date(budget.year, budget.month - 1).toLocaleDateString(
      'en-US',
      { month: 'long', year: 'numeric' }
    );

    // Calculate totals
    const totalBudget = budgetItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const totalSpent = budgetItems.reduce(
      (sum, item) => sum + Number(item.spent || 0),
      0
    );
    const remaining = totalBudget - totalSpent;
    const spentPercentage =
      totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0';

    // Build message with HTML formatting
    let message = `<b>💰 Budget Summary - ${month}</b>\n\n`;
    message += `<b>Monthly Income:</b> $${Number(budget.income || 0).toFixed(2)}\n\n`;

    message += `<b>📊 Budget Overview:</b>\n`;
    message += `• Total Budget: $${totalBudget.toFixed(2)}\n`;
    message += `• Total Spent: $${totalSpent.toFixed(2)} (${spentPercentage}%)\n`;
    message += `• Remaining: $${remaining.toFixed(2)}\n\n`;

    if (budgetItems.length > 0) {
      message += `<b>📋 Categories:</b>\n`;
      budgetItems.forEach((item) => {
        const itemAmount = Number(item.amount || 0);
        message += `- ${item.category_name}: $${itemAmount.toFixed(2)}\n`;
      });
    }

    message += `\n<i>Generated at ${new Date().toLocaleString()}</i>`;

    return message;
  };

  const handleSendToTelegram = async () => {
    // Check if budget exists first
    if (!budget) {
      toast({
        title: 'No Budget Selected',
        description: 'Please select a month with a budget first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Check connection status from backend
      const statusResponse = await httpClient.get('/api/v1/telegram/status');

      if (
        !statusResponse.data.success ||
        !statusResponse.data.data.is_connected
      ) {
        toast({
          title: 'Telegram Not Connected',
          description: 'Please connect your Telegram account first.',
          variant: 'destructive',
        });
        router.push('/settings');
        setIsSending(false);
        return;
      }

      const chatId = statusResponse.data.data.chat_id;
      if (!chatId) {
        throw new Error('No Telegram chat ID found');
      }

      const message = formatBudgetMessage(budget, budgetItems);

      // Send to backend API
      await httpClient.post('/api/v1/telegram/send', {
        chat_id: chatId,
        payload: {
          type: 'budget_alert',
          message: message,
          data: {
            budget_id: budget.id,
            month: budget.month,
            year: budget.year,
          },
        },
      });

      toast({
        title: '✅ Sent to Telegram',
        description: 'Your budget summary has been sent successfully!',
      });
    } catch (error) {
      console.error('Failed to send to Telegram:', error);
      toast({
        title: 'Failed to Send',
        description:
          error instanceof Error
            ? error.message
            : 'Could not send budget to Telegram. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={handleSendToTelegram}
      disabled={isSending || !budget}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isSending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Send to Telegram
        </>
      )}
    </Button>
  );
}
