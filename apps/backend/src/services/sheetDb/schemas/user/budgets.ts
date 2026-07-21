import { defineTable, string, number } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.budgets).
export default defineTable({
  name: 'budgets',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    year: number().required(),
    month: number().required(),
    income: number().required().min(0),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
