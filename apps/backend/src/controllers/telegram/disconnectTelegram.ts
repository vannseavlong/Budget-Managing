import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { TelegramConnectionStore } from '../../utils/TelegramConnectionStore';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function disconnectTelegram(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userEmail = authenticatedReq.user?.email;

    if (!userEmail) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    logger.info('🔌 Disconnecting Telegram for user:', { userEmail });

    // Get current connection to find chatId
    const connection = TelegramConnectionStore.getConnectionByEmail(userEmail);

    // Remove from memory store
    if (connection) {
      TelegramConnectionStore.removeConnection(userEmail, connection.chat_id);
      logger.info('✅ Removed from memory store');
    }

    // Remove from Google Sheets
    try {
      const sheetsService = new GoogleSheetsService();
      const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

      if (spreadsheetId && googleCredentials) {
        sheetsService.setCredentials(googleCredentials);

        // Clear Telegram fields in user record
        await sheetsService.updateUserTelegramInfo(userEmail, '', '');
        logger.info('✅ Removed from Google Sheets');
      }
    } catch (sheetsError) {
      logger.error('❌ Error removing from Google Sheets:', sheetsError);
      // Continue anyway - memory removal is sufficient
    }

    res.status(200).json({
      success: true,
      message: 'Telegram connection removed successfully',
    });
  } catch (error) {
    logger.error('Error disconnecting Telegram:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
