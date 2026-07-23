import { defineTable, string, json, date } from 'longcelot-sheet-db';

export default defineTable({
  name: 'telegram_messages',
  actor: 'user',
  timestamps: true,
  columns: {
    chat_id: string().required(),
    payload: json().required(),
    status: string().enum(['pending', 'sent', 'failed']).default('pending'),
    error: string(),
    telegram_message_id: string(),
    sent_at: date(),
  },
});
