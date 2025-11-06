import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

export async function connectTelegram(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { telegram_data } = req.body;

    if (!telegram_data) {
      res.status(400).json({
        success: false,
        message: 'Telegram data is required',
      });
      return;
    }

    // Here you would store the connection in your database/Google Sheets
    // For now, we'll simulate a successful connection
    logger.info('Processing Telegram connection:', telegram_data);

    res.status(200).json({
      success: true,
      data: {
        chat_id: telegram_data.id,
        username: telegram_data.username,
        first_name: telegram_data.first_name,
        connected_at: new Date().toISOString(),
      },
      message: 'Telegram connection processed successfully',
    });
  } catch (error) {
    logger.error('Error processing Telegram connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
