import { defineTable, string, date } from 'longcelot-sheet-db';

export default defineTable({
  name: 'user_stats',
  actor: 'admin',
  timestamps: true,
  columns: {
    user_id: string().required().unique(),
    email: string().required(),
    role: string().enum(['admin', 'user']).default('user'),
    last_login_at: date(),
  },
});
