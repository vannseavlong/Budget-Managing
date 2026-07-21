import { defineTable, string, number } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.budget_incomes).
export default defineTable({
  name: 'budget_incomes',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    year: number().required(),
    month: number().required(),
    amount: number().required().min(0),
    source: string(),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
