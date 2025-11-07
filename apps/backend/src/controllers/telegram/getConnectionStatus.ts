import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { TelegramConnectionStore } from '../../utils/TelegramConnectionStore';
import {
  GoogleSheetsService,
  DatabaseRecord,
} from '../../services/GoogleSheetsService';

export async function getConnectionStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get user email from the authenticated request
    const userEmail = (req as any).user?.email;

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
        const sheetsService = new GoogleSheetsService();
        const userSpreadsheetId = await sheetsService.getOrCreateUserDatabase(
          userEmail,
          userEmail.split('@')[0]
        );

        if (userSpreadsheetId) {
          const users = await sheetsService.find(userSpreadsheetId, 'users');
          const userRecord = users.find(
            (user: DatabaseRecord) => user.email === userEmail
          );

          if (userRecord && userRecord.telegram_username && userRecord.chatId) {
            // Found connection in Google Sheets, restore to memory
            TelegramConnectionStore.storeConnection(
              userEmail,
              userRecord.telegram_username as string,
              userRecord.chatId as string
            );

            connection = {
              email: userEmail,
              telegram_username: userRecord.telegram_username as string,
              chat_id: userRecord.chatId as string,
              connected_at:
                (userRecord.updated_at as string) || new Date().toISOString(),
              status: 'connected' as const,
            };

            logger.info('✅ Connection restored from Google Sheets');
          }
        }
      } catch (sheetsError) {
        logger.error('❌ Error loading from Google Sheets:', sheetsError);
        // Continue with memory-only check
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
