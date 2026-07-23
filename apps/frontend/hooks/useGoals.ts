import { useState, useCallback, useEffect } from 'react';
import { GoalsService } from '@/lib/goals-service';
import type { Goal, CreateGoalRequest, UpdateGoalRequest } from '@/types/goals';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await GoalsService.getGoals();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (payload: CreateGoalRequest) => {
    const created = await GoalsService.createGoal(payload);
    setGoals((prev) => [...prev, created]);
    return created;
  }, []);

  const updateGoal = useCallback(
    async (id: string, payload: UpdateGoalRequest) => {
      const updated = await GoalsService.updateGoal(id, payload);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      return updated;
    },
    []
  );

  const deleteGoal = useCallback(async (id: string) => {
    await GoalsService.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}

export default useGoals;
