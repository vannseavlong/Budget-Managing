import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { disconnectAllTelegramConnections } from './connectionStore';

/**
 * POST /api/v1/telegram/disconnect — removes the user's Telegram
 * connection row(s) for real (backend-v1 removed from its in-memory store
 * and best-effort cleared two columns on the legacy Google Sheets `users`
 * row; there's no equivalent legacy layer here, so this is just the real
 * delete against `telegram_connections`).
 */
export async function disconnectTelegram(
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

    logger.info('Disconnecting Telegram for user:', { userEmail: user.email });

    const removed = await disconnectAllTelegramConnections(
      user.email,
      user.spreadsheetId
    );

    logger.info(
      `Removed ${removed} Telegram connection(s) for user: ${user.email}`
    );

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
