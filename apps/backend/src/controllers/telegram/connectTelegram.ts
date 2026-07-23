import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { connectTelegramSchema } from './types';
import { upsertTelegramConnectionByEmail } from './connectionStore';

/**
 * POST /api/v1/telegram/connect — a real persistence path now. backend-v1's
 * version just echoed `telegram_data` back with a 200 and never stored
 * anything ("Here you would store the connection in your
 * database/Google Sheets ... For now, we'll simulate a successful
 * connection"). Uses the same upsert-by-email helper as the webhook's
 * `/start connect_<email>` deep-link flow.
 */
export async function connectTelegram(
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

    const { telegram_data } = connectTelegramSchema.parse(req.body);
    const chatId = String(telegram_data.id);

    logger.info('Processing Telegram connection:', {
      email: user.email,
      chatId,
      username: telegram_data.username,
    });

    const result = await upsertTelegramConnectionByEmail(
      user.email,
      {
        chatId,
        telegramUsername: telegram_data.username,
        status: 'connected',
      },
      user.spreadsheetId
    );

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'User account not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        chat_id: chatId,
        username: telegram_data.username,
        first_name: telegram_data.first_name,
        connected_at: result.connection.connected_at,
      },
      message: 'Telegram connection processed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    logger.error('Error processing Telegram connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
