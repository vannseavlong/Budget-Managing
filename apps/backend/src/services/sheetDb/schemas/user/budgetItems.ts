import { defineTable, string, number } from 'longcelot-sheet-db';

// category_id is intentionally left without ref() — same reasoning as
// backend-v1: skip an extra lookup call, the frontend already sends a
// valid category id from its own state.
export default defineTable({
  name: 'budget_items',
  actor: 'user',
  timestamps: true,
  columns: {
    budget_id: string().required().ref('budgets._id'),
    category_id: string().required(),
    category_name: string(),
    amount: number().required().min(0),
    spent: number().default(0),
  },
});
