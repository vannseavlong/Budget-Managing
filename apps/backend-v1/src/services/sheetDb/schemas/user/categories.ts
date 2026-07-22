import { defineTable, string } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet exactly (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.categories) so
// existing user spreadsheets need no migration. `timestamps`/`softDelete`
// are deliberately off — created_at/updated_at stay app-managed plain
// columns to keep the API response shape unchanged.
export default defineTable({
  name: 'categories',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    name: string().required(),
    emoji: string(),
    color: string(),
    created_at: string().required(),
    updated_at: string().required(),
  },
});
