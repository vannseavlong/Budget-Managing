import { defineTable, string, date } from 'longcelot-sheet-db';

// Column names match the existing hand-rolled sheet (see
// services/googleSheets/schema-versions.ts BASE_SCHEMA.telegram_messages),
// plus `telegram_message_id`, which sendMessage.ts already writes but
// BASE_SCHEMA never declared — 'auto-sync' (adapter.ts) will add the
// missing column additively rather than silently dropping the field.
export default defineTable({
  name: 'telegram_messages',
  actor: 'user',
  columns: {
    id: string().required().unique(),
    user_id: string().required(),
    chat_id: string().required(),
    payload: string().required(),
    status: string().required().enum(['pending', 'sent', 'failed']),
    error: string(),
    telegram_message_id: string(),
    sent_at: date(),
    created_at: string().required(),
  },
});
