import { defineTable, string, number } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.budget_items). No
// user_id column — ownership is validated through the parent budget, same
// as the old code.
export default defineTable({
  name: 'budget_items',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    budget_id: string().required().ref('budgets.id'),
    // category_id intentionally has no ref() — the old controller
    // explicitly skips category validation here to save API calls
    // ("we can trust the frontend sends valid data"); preserving that.
    category_id: string().required(),
    category_name: string(),
    amount: number().required().min(0),
    spent: number().min(0),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
