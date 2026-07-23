import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { upsertTelegramConnectionByEmail } from './connectionStore';

/**
 * GET /api/v1/telegram/test-connection/:email/:username/:chatId — public,
 * no auth (ported verbatim as a manual testing tool, matching backend-v1).
 * Named `createTestConnection` here (not `testConnection`) to avoid
 * colliding with the unrelated `GET /telegram/test` handler.
 */
export async function createTestConnection(
  req: Request,
  res: Response
): Promise<void> {
  const { email, username, chatId } = req.params;

  try {
    const result = await upsertTelegramConnectionByEmail(email, {
      chatId,
      telegramUsername: username,
      status: 'connected',
    });

    if (!result) {
      res.status(404).json({
        success: false,
        message: `User ${email} not found`,
      });
      return;
    }

    res.json({
      success: true,
      message: `Test connection created for ${email}`,
      data: {
        stored_connection: result.connection,
      },
    });
  } catch (error) {
    logger.error('Error creating test connection:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
