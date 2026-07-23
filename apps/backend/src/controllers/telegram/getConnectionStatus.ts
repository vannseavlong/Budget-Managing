import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { findActiveTelegramConnection } from './connectionStore';

/**
 * GET /api/v1/telegram/status — response shape is a frontend contract,
 * read by both `TelegramConnectionCard.tsx` and `SendToTelegramButton.tsx`:
 * `{ success: true, data: { is_connected, chat_id?, telegram_username?,
 * connected_at? } }`.
 */
export async function getConnectionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const connection = await findActiveTelegramConnection(
      user.email,
      user.spreadsheetId
    );

    if (connection) {
      res.status(200).json({
        success: true,
        data: {
          is_connected: true,
          chat_id: connection.chat_id as string,
          telegram_username: connection.telegram_username as string | undefined,
          connected_at: connection.connected_at as string | undefined,
        },
        message: 'Connection status retrieved successfully',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        is_connected: false,
      },
      message: 'No Telegram connection found',
    });
  } catch (error) {
    logger.error('Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
