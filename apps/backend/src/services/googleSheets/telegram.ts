import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { DatabaseRecord } from './types';
import { find, update } from './crud';
import { getOrCreateUserDatabase } from './database';
import { logger } from '../../utils/logger';

export async function updateUserTelegramInfo(
  userEmail: string,
  telegramUsername: string,
  chatId: string
): Promise<void> {
  try {
    const userSpreadsheetId = await findUserSpreadsheet(userEmail);
    if (!userSpreadsheetId) {
      logger.warn(`No spreadsheet found for user: ${userEmail}`);
      return;
    }

    const users = await find(userSpreadsheetId, 'users');
    const userRecord = users.find(
      (user: DatabaseRecord) => user.email === userEmail
    );
    if (!userRecord) {
      logger.warn(`User record not found for email: ${userEmail}`);
      return;
    }

    const updateData = {
      telegram_username: telegramUsername,
      chatId: chatId,
      updated_at: new Date().toISOString(),
    } as DatabaseRecord;
    await update(
      userSpreadsheetId,
      'users',
      userRecord.id as string,
      updateData
    );

    logger.info('✅ User Telegram info updated in Google Sheets', {
      userEmail,
      telegramUsername,
      chatId,
    });
  } catch (error) {
    logger.error('❌ Error updating user Telegram info:', error);
    throw error;
  }
}

export async function findUserSpreadsheet(
  userEmail: string
): Promise<string | null> {
  try {
    const userInfo = await getUserInfo();
    if (userInfo.email === userEmail) {
      return await getOrCreateUserDatabase(userEmail, userInfo.name);
    }
    logger.warn(
      `Cannot find spreadsheet for user ${userEmail} - not the authenticated user`
    );
    return null;
  } catch (error) {
    logger.error('Error finding user spreadsheet:', error);
    return null;
  }
}

export async function validateUserDatabase(
  spreadsheetId: string
): Promise<boolean> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.get({ spreadsheetId });
    return true;
  } catch (error) {
    logger.error('Error validating user database:', error);
    return false;
  }
}

export async function getUserInfo(): Promise<{ email: string; name: string }> {
  try {
    const client = getAuthenticatedClient();
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const response = await oauth2.userinfo.get();
    logger.info('Google userinfo response:', response.data);
    const name =
      response.data.name ||
      response.data.given_name ||
      response.data.email!.split('@')[0];
    return { email: response.data.email!, name };
  } catch (error) {
    logger.error('Error getting user info:', error);
    throw new Error('Failed to get user information');
  }
}
