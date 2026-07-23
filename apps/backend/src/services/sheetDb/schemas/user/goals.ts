import { defineTable, string, number, boolean, date } from 'longcelot-sheet-db';

export default defineTable({
  name: 'goals',
  actor: 'user',
  timestamps: true,
  softDelete: true,
  columns: {
    name: string().required(),
    limit_amount: number().required().min(0),
    period: string().enum(['daily', 'weekly', 'monthly', 'yearly']).required(),
    notify_telegram: boolean().default(false),
    last_notified_at: date(),
  },
});
