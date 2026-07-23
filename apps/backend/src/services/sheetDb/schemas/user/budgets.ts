import { defineTable, number } from 'longcelot-sheet-db';

export default defineTable({
  name: 'budgets',
  actor: 'user',
  timestamps: true,
  softDelete: true,
  columns: {
    year: number().required(),
    month: number().required(),
    income: number().required().min(0),
  },
});
