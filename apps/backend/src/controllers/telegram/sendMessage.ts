import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { sendTelegramMessageSchema, getBotToken } from './types';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    message_id: number;
  };
  description?: string;
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
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

    const messageId = `msg_${Date.now()}`;
    const now = new Date().toISOString();
    let telegramMessageId = null;
    let sentAt = null;
    let status = 'pending';
    let error = null;

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
          parse_mode: 'HTML', // Support HTML formatting
        }),
      });

      const telegramResult =
        (await telegramResponse.json()) as TelegramApiResponse;

      if (telegramResponse.ok && telegramResult.ok) {
        // Message sent successfully
        telegramMessageId = telegramResult.result?.message_id || null;
        sentAt = now;
        status = 'sent';
        logger.info(`Telegram message sent successfully: ${messageId}`, {
          telegram_message_id: telegramMessageId,
          chat_id: validatedData.chat_id,
        });
      } else {
        // Message failed to send
        status = 'failed';
        error = telegramResult.description || 'Failed to send message';
        logger.error(`Failed to send Telegram message: ${messageId}`, {
          error: telegramResult,
          chat_id: validatedData.chat_id,
        });
      }
    } catch (telegramError) {
      // Network or API error
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

    // Save message to Google Sheets database
    try {
      const googleSheetsService = new GoogleSheetsService();
      googleSheetsService.setCredentials(googleCredentials);

      const messageData = {
        id: messageId,
        user_id: authenticatedReq.user!.email,
        chat_id: validatedData.chat_id,
        payload: JSON.stringify(validatedData.payload),
        status: status,
        error: error,
        telegram_message_id: telegramMessageId,
        sent_at: sentAt,
        created_at: now,
      };

      await googleSheetsService.insert(
        spreadsheetId,
        'telegram_messages',
        messageData
      );

      logger.info(`Telegram message saved to database: ${messageId}`);
    } catch (dbError) {
      logger.error(
        `Failed to save Telegram message to database: ${messageId}`,
        dbError
      );
      // Don't fail the request if database save fails, but log it
    }

    res.status(201).json({
      success: true,
      data: {
        id: messageId,
        ...validatedData,
        status: status,
        sent_at: sentAt,
        created_at: now,
        telegram_message_id: telegramMessageId,
        error: error,
      },
      message:
        status === 'sent'
          ? 'Telegram message sent successfully'
          : status === 'failed'
            ? 'Failed to send Telegram message'
            : 'Telegram message queued successfully',
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
