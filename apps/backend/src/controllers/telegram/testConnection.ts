import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { getBotToken } from './types';

/**
 * GET /api/v1/telegram/test — ported verbatim from backend-v1: still a
 * placeholder (doesn't actually call Telegram's `getMe`/`getWebhookInfo`).
 */
export async function testConnection(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const botToken = getBotToken();

    logger.info(
      `Environment check - TELEGRAM_BOT_TOKEN exists: ${!!process.env.TELEGRAM_BOT_TOKEN}`
    );
    logger.info(
      `getBotToken() result: ${botToken ? 'Token found' : 'No token'}`
    );

    if (!botToken) {
      res.status(200).json({
        success: true,
        data: {
          bot_username: null,
          is_connected: false,
          webhook_configured: false,
          error:
            'Bot token not configured. Please set TELEGRAM_BOT_TOKEN environment variable.',
          debug: {
            env_var_exists: !!process.env.TELEGRAM_BOT_TOKEN,
            env_var_length: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
          },
        },
        message: 'Telegram connection status checked',
      });
      return;
    }

    logger.info(
      `Testing connection for bot token: ${botToken.substring(0, 10)}...`
    );

    res.status(200).json({
      success: true,
      data: {
        bot_username: 'budget_manager_bot',
        is_connected: true,
        webhook_configured: false,
        bot_token_configured: true,
      },
      message: 'Telegram connection tested successfully',
    });
  } catch (error) {
    logger.error('Error testing Telegram connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
