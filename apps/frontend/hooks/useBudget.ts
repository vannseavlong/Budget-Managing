import { useEffect, useState, useCallback } from 'react';
import BudgetsService, { Budget } from '@/lib/budgets-service';

type UiBudgetItem = {
  id: string;
  name: string;
  cost: number;
  spent: number;
  status: 'Spent' | 'Not Yet';
};

export function useBudget() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<UiBudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(
    async (filters?: { year?: number; month?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const resp = await BudgetsService.getBudgets(filters);
        setBudgets(resp);
        // Select latest budget if none selected
        if (resp.length > 0 && !selectedBudget) {
          setSelectedBudget(resp[0]);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load budgets');
      } finally {
        setLoading(false);
      }
    },
    [selectedBudget]
  );

  const loadBudgetItems = useCallback(
    async (budgetId?: string) => {
      if (!budgetId && !selectedBudget) return;
      const id = budgetId || selectedBudget!.id;
      setLoading(true);
      setError(null);
      try {
        // Try to fetch items; if empty, retry once after a short delay to
        // tolerate eventual consistency in Google Sheets reads.
        let resp = await BudgetsService.getBudgetItems(id);
        if ((!resp || resp.length === 0) && process.env.NODE_ENV !== 'test') {
          // small delay then retry once
          await new Promise((r) => setTimeout(r, 300));
          resp = await BudgetsService.getBudgetItems(id);
        }

        // map to UI shape
        const ui = (resp || []).map(
          (it) =>
            ({
              id: it.id,
              name: it.category_name,
              cost: Number(it.amount) || 0,
              spent: Number(it.spent) || 0,
              status:
                Number(it.spent) && Number(it.spent) > 0 ? 'Spent' : 'Not Yet',
            }) as UiBudgetItem
        );
        setItems(ui);
      } catch (err: any) {
        setError(err?.message || 'Failed to load budget items');
      } finally {
        setLoading(false);
      }
    },
    [selectedBudget]
  );

  useEffect(() => {
    // on mount, load budgets
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (selectedBudget) {
      loadBudgetItems(selectedBudget.id);
    } else {
      setItems([]);
    }
  }, [selectedBudget, loadBudgetItems]);

  const selectBudget = (id: string) => {
    const found = budgets.find((b) => b.id === id) || null;
    setSelectedBudget(found);
  };

  const createBudgetItem = async (payload: {
    budget_id: string;
    category_id: string;
    category_name: string;
    amount: number;
  }) => {
    setLoading(true);
    try {
      const created = await BudgetsService.createBudgetItem(payload);
      // Refresh budgets (in case a new budget was just created elsewhere)
      try {
        await loadBudgets();
      } catch {
        // ignore - we'll still try to load items
      }

      // Ensure selectedBudget is the budget we just added an item to
      // fetch fresh budgets and pick the budget we just used
      try {
        const fresh = await BudgetsService.getBudgets();
        setBudgets(fresh);
        const found = fresh.find((b) => b.id === payload.budget_id);
        if (found) setSelectedBudget(found);
      } catch {
        // non-fatal
      }

      // Reload items for the budget (loadBudgetItems includes a retry)
      await loadBudgetItems(payload.budget_id);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create budget item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetItem = async (id: string, payload: any) => {
    setLoading(true);
    try {
      const updated = await BudgetsService.updateBudgetItem(id, payload);
      if (selectedBudget) await loadBudgetItems(selectedBudget.id);
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update budget item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBudgetItem = async (id: string) => {
    setLoading(true);
    try {
      await BudgetsService.deleteBudgetItem(id);
      if (selectedBudget) await loadBudgetItems(selectedBudget.id);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to delete budget item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (payload: {
    year: number;
    month: number;
    income: number;
  }) => {
    setLoading(true);
    try {
      const created = await BudgetsService.createBudget(payload);
      await loadBudgets();
      setSelectedBudget(created);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create budget');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    budgets,
    selectedBudget,
    items,
    loading,
    error,
    loadBudgets,
    selectBudget,
    loadBudgetItems,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    createBudget,
  };
}

export default useBudget;
