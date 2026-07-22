import { Request, Response } from 'express';
import { TelegramConnectionStore } from '../../utils/TelegramConnectionStore';
import { logger } from '../../utils/logger';

export async function debugConnections(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userEmail = (req as Request & { user?: { email: string } }).user
      ?.email;
    const allConnections = TelegramConnectionStore.getAllConnections();

    res.status(200).json({
      success: true,
      data: {
        current_user_email: userEmail,
        all_connections: allConnections,
        connection_for_user: TelegramConnectionStore.getConnectionByEmail(
          userEmail || ''
        ),
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
