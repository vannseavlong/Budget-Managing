import { defineTable, string, date } from 'longcelot-sheet-db';

// Replaces backend-v1's in-memory TelegramConnectionStore (a module-level
// Map, explicitly documented there as temporary and not surviving process
// restarts or multi-instance deployment) with real persistent storage.
export default defineTable({
  name: 'telegram_connections',
  actor: 'user',
  timestamps: true,
  columns: {
    chat_id: string().required(),
    telegram_username: string(),
    status: string()
      .enum(['connected', 'pending', 'disconnected'])
      .default('pending'),
    connected_at: date(),
  },
});
