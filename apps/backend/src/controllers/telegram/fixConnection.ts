import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import {
  resolveActorSheetId,
  upsertTelegramConnectionByEmail,
} from './connectionStore';

/**
 * GET /api/v1/telegram/fix-connection/:oldEmail/:newEmail — public, no
 * auth (ported verbatim as a manual debugging tool, matching backend-v1).
 * backend-v1 moved a row within one shared in-memory Map; here that means
 * actually reading the connected row out of `oldEmail`'s per-user sheet,
 * deleting it there, and re-persisting it under `newEmail`'s sheet through
 * the same shared upsert helper used everywhere else.
 */
export async function fixConnection(
  req: Request,
  res: Response
): Promise<void> {
  const { oldEmail, newEmail } = req.params;

  try {
    const oldActorSheetId = await resolveActorSheetId(oldEmail);
    if (!oldActorSheetId) {
      res.json({
        success: false,
        message: `No connection found for ${oldEmail}`,
      });
      return;
    }

    const oldTable = await getUserTable(
      oldEmail,
      oldActorSheetId,
      'telegram_connections'
    );
    const oldConnection = await oldTable.findOne({
      where: { status: 'connected' },
    });

    if (!oldConnection) {
      res.json({
        success: false,
        message: `No connection found for ${oldEmail}`,
      });
      return;
    }

    await oldTable.delete({
      where: { chat_id: oldConnection.chat_id as string },
    });

    const result = await upsertTelegramConnectionByEmail(newEmail, {
      chatId: oldConnection.chat_id as string,
      telegramUsername: oldConnection.telegram_username as string | undefined,
      status: 'connected',
    });

    if (!result) {
      res.status(404).json({
        success: false,
        message: `Target user ${newEmail} not found`,
      });
      return;
    }

    res.json({
      success: true,
      message: `Connection updated from ${oldEmail} to ${newEmail}`,
      data: {
        old_connection: oldConnection,
        new_connection: result.connection,
      },
    });
  } catch (error) {
    logger.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
