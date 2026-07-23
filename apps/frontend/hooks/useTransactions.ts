import { useState, useCallback, useEffect } from 'react';
import { TransactionsService } from '@/lib/transactions-service';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
} from '@/types/transactions';

/**
 * A personal budget app's transaction volume comfortably fits lsdb's own
 * "hundreds to low-thousands of rows" comfort zone, so pages that need
 * "all of it" (dashboard, summary, goals progress) fetch once at the
 * backend's max page size instead of implementing real pagination.
 */
export const ALL_TRANSACTIONS_PER_PAGE = 500;

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryId = filters?.category_id;
  const dateFrom = filters?.date_from;
  const dateTo = filters?.date_to;
  const perPage = filters?.per_page ?? ALL_TRANSACTIONS_PER_PAGE;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TransactionsService.getTransactions({
        per_page: perPage,
        category_id: categoryId,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load transactions'
      );
    } finally {
      setLoading(false);
    }
  }, [perPage, categoryId, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async (payload: CreateTransactionRequest) => {
      const created = await TransactionsService.createTransaction(payload);
      setTransactions((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, payload: UpdateTransactionRequest) => {
      const updated = await TransactionsService.updateTransaction(id, payload);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
      return updated;
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await TransactionsService.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export default useTransactions;
