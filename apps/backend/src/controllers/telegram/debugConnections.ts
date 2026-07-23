import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/**
 * GET /api/v1/telegram/debug-connections — backend-v1 dumped its
 * process-wide in-memory `TelegramConnectionStore` (every user's
 * connections, since it was a single shared `Map`). There's no
 * equivalent global store anymore — each user's connections live only in
 * their own sheet — so this now reports the *authenticated* user's own
 * `telegram_connections` rows instead.
 */
export async function debugConnections(
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

    const table = await getUserTable(
      user.email,
      user.spreadsheetId,
      'telegram_connections'
    );
    const allConnections = await table.findMany();
    const connectionForUser =
      allConnections.find((row) => row.status === 'connected') ?? null;

    res.status(200).json({
      success: true,
      data: {
        current_user_email: user.email,
        all_connections: allConnections,
        connection_for_user: connectionForUser,
      },
      message: 'Debug information retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting debug connections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
