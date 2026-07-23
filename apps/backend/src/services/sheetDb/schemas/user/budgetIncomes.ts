import { defineTable, string, number } from 'longcelot-sheet-db';

export default defineTable({
  name: 'budget_incomes',
  actor: 'user',
  timestamps: true,
  columns: {
    year: number().required(),
    month: number().required(),
    amount: number().required().min(0),
    source: string(),
  },
});
