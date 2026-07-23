/**
 * Shared client-side aggregation helpers for transaction data — used by
 * the goals, dashboard, and summary pages so period math (today/this
 * week/this month/this year) and category grouping stay consistent
 * across all three instead of each reimplementing it.
 *
 * Deliberately doesn't use the backend's /transactions/summary endpoint:
 * that endpoint splits totals into total_income/total_expenses by the
 * sign of `amount`, but createTransactionSchema requires a positive
 * amount for every entry — this app has no income-vs-expense concept on
 * a transaction (income lives separately in the budgets/incomes table),
 * so every transaction is an expense and that split doesn't apply here.
 */
import type { Goal, GoalPeriod } from '@/types/goals';
import type { Transaction } from '@/types/transactions';

export function startOfPeriod(period: GoalPeriod, now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'daily':
      return start;
    case 'weekly':
      start.setDate(start.getDate() - start.getDay());
      return start;
    case 'monthly':
      start.setDate(1);
      return start;
    case 'yearly':
      start.setMonth(0, 1);
      return start;
  }
}

export function sumSince(transactions: Transaction[], since: Date): number {
  return transactions
    .filter((t) => new Date(t.date) >= since)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function goalProgress(goal: Goal, transactions: Transaction[]) {
  const since = startOfPeriod(goal.period, new Date());
  const currentAmount = sumSince(transactions, since);
  const exceeded = currentAmount > goal.limit_amount;
  return {
    currentAmount,
    exceeded,
    percentage: Math.min((currentAmount / goal.limit_amount) * 100, 100),
  };
}

export function isSameMonth(dateStr: string, year: number, month: number) {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

export function transactionsInMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  return transactions.filter((t) => isSameMonth(t.date, year, month));
}

export function totalAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export interface CategoryBreakdownEntry {
  name: string;
  amount: number;
  percentage: number;
}

/** Groups transactions by category_name, sorted by amount descending. */
export function categoryBreakdown(
  transactions: Transaction[]
): CategoryBreakdownEntry[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    const name = t.category_name || 'Uncategorized';
    totals.set(name, (totals.get(name) || 0) + t.amount);
  }

  const grandTotal = totalAmount(transactions);
  return Array.from(totals.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthOption {
  year: number;
  month: number;
  label: string;
}

/** Trailing `count` months (including the current one), newest first. */
export function monthOptions(count: number, now: Date = new Date()): MonthOption[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  });
}

/** Sum per calendar month for the trailing `months` months, oldest first. */
export function monthlyTrend(
  transactions: Transaction[],
  months: number,
  now: Date = new Date()
): { month: string; amount: number }[] {
  const result: { month: string; amount: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const amount = totalAmount(
      transactionsInMonth(transactions, d.getFullYear(), d.getMonth() + 1)
    );
    result.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      amount,
    });
  }

  return result;
}
