import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { getUserTable } from '../../services/sheetDb/userContext';
import { sendTelegramMessageSchema, getBotToken } from './types';

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    message_id: number;
  };
  description?: string;
}

/**
 * POST /api/v1/telegram/send — calls the real Telegram Bot API
 * (`sendMessage`), logging the attempt/result to `telegram_messages`
 * regardless of outcome: a row is created with `status: 'pending'` before
 * the API call, then updated to `sent`/`failed` with the result.
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const validatedData = sendTelegramMessageSchema.parse(req.body);
    const botToken = getBotToken();

    if (!botToken) {
      res.status(500).json({
        success: false,
        message:
          'Telegram bot token not configured. Please set TELEGRAM_BOT_TOKEN environment variable.',
      });
      return;
    }

    const messagesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'telegram_messages'
    );

    let messageId: string | undefined;
    try {
      const created = await messagesTable.create({
        chat_id: validatedData.chat_id,
        payload: validatedData.payload,
        status: 'pending',
      });
      messageId = created._id as string;
    } catch (dbError) {
      logger.error('Failed to create Telegram message log entry:', dbError);
    }

    const now = new Date().toISOString();
    let telegramMessageId: number | null = null;
    let sentAt: string | null = null;
    let status: 'sent' | 'failed' = 'failed';
    let error: string | null = null;

    try {
      // Send message via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const telegramResponse = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: validatedData.chat_id,
          text: validatedData.payload.message,
          parse_mode: 'HTML',
        }),
      });

      const telegramResult =
        (await telegramResponse.json()) as TelegramApiResponse;

      if (telegramResponse.ok && telegramResult.ok) {
        telegramMessageId = telegramResult.result?.message_id ?? null;
        sentAt = now;
        status = 'sent';
        logger.info(`Telegram message sent successfully: ${messageId}`, {
          telegram_message_id: telegramMessageId,
          chat_id: validatedData.chat_id,
        });
      } else {
        status = 'failed';
        error = telegramResult.description || 'Failed to send message';
        logger.error(`Failed to send Telegram message: ${messageId}`, {
          error: telegramResult,
          chat_id: validatedData.chat_id,
        });
      }
    } catch (telegramError) {
      status = 'failed';
      error =
        telegramError instanceof Error
          ? telegramError.message
          : 'Unknown error';
      logger.error(
        `Error sending Telegram message: ${messageId}`,
        telegramError
      );
    }

    if (messageId) {
      try {
        await messagesTable.update({
          where: { _id: messageId },
          data: {
            status,
            error: error ?? undefined,
            telegram_message_id:
              telegramMessageId !== null
                ? String(telegramMessageId)
                : undefined,
            sent_at: sentAt ?? undefined,
          },
        });
        logger.info(`Telegram message log updated: ${messageId}`);
      } catch (dbError) {
        logger.error(
          `Failed to update Telegram message log entry: ${messageId}`,
          dbError
        );
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: messageId,
        chat_id: validatedData.chat_id,
        payload: validatedData.payload,
        status,
        sent_at: sentAt,
        created_at: now,
        telegram_message_id: telegramMessageId,
        error,
      },
      message:
        status === 'sent'
          ? 'Telegram message sent successfully'
          : 'Failed to send Telegram message',
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

    logger.error('Error sending Telegram message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
