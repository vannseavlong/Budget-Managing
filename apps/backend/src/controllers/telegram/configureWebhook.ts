import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { configureWebhookSchema, getBotToken } from './types';

/**
 * POST /api/v1/telegram/configure — ported verbatim from backend-v1: still
 * a placeholder that validates inputs and reports success without actually
 * calling Telegram's `setWebhook` API. No behavior change intended here;
 * out of scope to wire up the real call for this pass.
 */
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
