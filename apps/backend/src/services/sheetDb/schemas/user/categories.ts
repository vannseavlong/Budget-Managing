import { defineTable, string } from 'longcelot-sheet-db';

export default defineTable({
  name: 'categories',
  actor: 'user',
  timestamps: true,
  columns: {
    name: string().required(),
    emoji: string(),
    color: string(),
  },
});
