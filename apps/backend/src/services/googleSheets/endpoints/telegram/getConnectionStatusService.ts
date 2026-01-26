import { DatabaseRecord } from '../../types';

async function fetchConnectionFromSheets(userEmail: string) {
  // Use the shared database helpers exported from the googleSheets service root
  // This will call into services/googleSheets/database.ts and crud.ts
  const { getOrCreateUserDatabase, find } = await import('../../');

  const spreadsheetId = await getOrCreateUserDatabase(
    userEmail,
    userEmail.split('@')[0]
  );

  if (!spreadsheetId) return null;

  const users = await find(spreadsheetId, 'users');

  const userRecord: DatabaseRecord | undefined = users.find(
    (u: DatabaseRecord) => u.email === userEmail
  );

  if (
    userRecord &&
    (userRecord.telegram_username || userRecord.telegram_username === '') &&
    (userRecord.chatId || userRecord.chatId === '')
  ) {
    return {
      telegram_username: (userRecord.telegram_username as string) || null,
      // keep both variants because code elsewhere expects `chatId` and `chat_id`
      chatId: (userRecord.chatId as string) || null,
      chat_id: (userRecord.chatId as string) || null,
      connected_at:
        (userRecord.updated_at as string) || new Date().toISOString(),
      status: 'connected' as const,
    };
  }

  return null;
}

export const getConnectionStatusService = {
  fetchConnectionFromSheets,
};

export default getConnectionStatusService;
