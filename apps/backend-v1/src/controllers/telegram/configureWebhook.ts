import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { configureWebhookSchema, getBotToken } from './types';
import { z } from 'zod';

export async function configureWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = configureWebhookSchema.parse(req.body);
    const botToken = getBotToken() || validatedData.bot_token;

    if (!botToken) {
      res.status(400).json({
        success: false,
        message:
          'Bot token is required. Provide it in request body or set TELEGRAM_BOT_TOKEN environment variable.',
      });
      return;
    }

    // Implementation placeholder - will be implemented with Telegram Bot API integration
    // Example webhook setup URL: https://api.telegram.org/bot{token}/setWebhook
    logger.info(
      `Would configure webhook: ${validatedData.webhook_url} for bot: ${botToken.substring(0, 10)}...`
    );

    res.status(200).json({
      success: true,
      data: {
        webhook_url: validatedData.webhook_url,
        bot_configured: true,
      },
      message: 'Telegram webhook configured successfully',
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

    logger.error('Error configuring Telegram webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
