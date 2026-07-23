import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/**
 * GET /api/v1/auth/profile — `telegram_username`/`chatId` used to live on
 * the per-user `users` sheet row; that data now lives in the
 * `telegram_connections` table, looked up here to keep the exact same
 * response shape apps/frontend/app/(protected)/settings/page.tsx expects
 * (`chatId` is deliberately camelCase here, unlike telegram/status's
 * `chat_id` — an existing asymmetry to preserve, not a bug).
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'User not authenticated' });
      return;
    }

    const telegramTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'telegram_connections'
    );
    const connection = await telegramTable.findOne({
      where: { status: 'connected' },
    });

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        telegram_username: connection?.telegram_username || null,
        chatId: connection?.chat_id || null,
        spreadsheetId: user.spreadsheetId,
        role: user.role,
      },
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
}
