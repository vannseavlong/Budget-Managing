import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { TelegramConnectionStore } from '../../utils/TelegramConnectionStore';
import { getConnectionStatusService } from '../../services/googleSheets/endpoints/telegram/getConnectionStatusService';

export async function getConnectionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get user email from the authenticated request
    const userEmail = req.user?.email;

    logger.info('🔍 Getting connection status for user:', { userEmail });

    if (!userEmail) {
      logger.warn('❌ User not authenticated - no email found');
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Debug: List all connections in store
    const allConnections = TelegramConnectionStore.getAllConnections();
    logger.info('📊 All connections in store:', allConnections);

    // First check connection status in memory store
    let connection = TelegramConnectionStore.getConnectionByEmail(userEmail);

    // If not in memory, try to load from Google Sheets
    if (!connection) {
      try {
        const result =
          await getConnectionStatusService.fetchConnectionFromSheets(userEmail);

        if (result) {
          // restore to memory store
          TelegramConnectionStore.storeConnection(
            userEmail,
            result.telegram_username as string,
            (result.chatId || result.chat_id) as string
          );

          connection = {
            email: userEmail,
            telegram_username: result.telegram_username as string,
            chat_id: (result.chatId || result.chat_id) as string,
            connected_at: result.connected_at,
            status: 'connected' as const,
          };
        }
      } catch (sheetsError) {
        // Keep going — fall back to memory-only check
      }
    }

    logger.info('🔎 Final connection found for email:', {
      userEmail,
      connection,
    });

    if (connection) {
      logger.info('✅ Connection found, returning success');
      res.status(200).json({
        success: true,
        data: {
          is_connected: true,
          telegram_username: connection.telegram_username,
          chat_id: connection.chat_id,
          connected_at: connection.connected_at,
        },
        message: 'Connection status retrieved successfully',
      });
    } else {
      logger.info('❌ No connection found for user');
      res.status(200).json({
        success: true,
        data: {
          is_connected: false,
          telegram_username: null,
          chat_id: null,
          connected_at: null,
        },
        message: 'No Telegram connection found',
      });
    }
  } catch (error) {
    logger.error('Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
