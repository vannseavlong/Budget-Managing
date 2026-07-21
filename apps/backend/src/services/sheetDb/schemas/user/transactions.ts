import { defineTable, string, number, date } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.transactions).
export default defineTable({
  name: 'transactions',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    name: string().required(),
    amount: number().required().min(0),
    category_id: string().required().ref('categories.id'),
    category_name: string(),
    date: date().required(),
    time: string(),
    notes: string(),
    receipt_url: string(),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
