import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

export async function debugEnv(req: Request, res: Response): Promise<void> {
  try {
    // Only show this in development
    if (process.env.NODE_ENV !== 'development') {
      res.status(403).json({
        success: false,
        message: 'Debug endpoint only available in development',
      });
      return;
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

    res.status(200).json({
      success: true,
      data: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        telegram_bot_token_exists: !!telegramToken,
        telegram_bot_token_length: telegramToken?.length || 0,
        telegram_bot_token_preview: telegramToken
          ? `${telegramToken.substring(0, 10)}...`
          : null,
        all_env_keys: Object.keys(process.env).filter((key) =>
          key.includes('TELEGRAM')
        ),
      },
      message: 'Environment debug information',
    });
  } catch (error) {
    logger.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
