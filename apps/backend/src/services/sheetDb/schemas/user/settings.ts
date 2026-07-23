import { defineTable, string, boolean } from 'longcelot-sheet-db';

export default defineTable({
  name: 'settings',
  actor: 'user',
  timestamps: true,
  columns: {
    currency: string().default('USD'),
    language: string().default('en'),
    dark_mode: boolean().default(false),
    telegram_notifications: boolean().default(false),
    onboarding_complete: boolean().default(false),
  },
});
