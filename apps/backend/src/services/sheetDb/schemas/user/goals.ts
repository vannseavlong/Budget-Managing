import { defineTable, string, number, boolean, date } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.goals).
export default defineTable({
  name: 'goals',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    name: string().required(),
    limit_amount: number().required().min(0),
    period: string().required().enum(['daily', 'weekly', 'monthly', 'yearly']),
    notify_telegram: boolean().default(false),
    last_notified_at: date(),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
