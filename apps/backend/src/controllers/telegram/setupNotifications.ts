import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { getUserTable } from '../../services/sheetDb/userContext';
import { setupNotificationsSchema } from './types';

/**
 * POST /api/v1/telegram/setup-notifications — backend-v1 never persisted
 * this ("Here you would typically: 1. Save the chat_id to user settings
 * ..." followed by nothing). A real `settings` table exists now, so this
 * genuinely flips `settings.telegram_notifications` on for the user.
 * (`settings` only has a single boolean flag, not a per-type preference
 * list, so `notification_types`/`enable_all` are accepted and echoed back
 * for API parity but don't change what gets persisted beyond that flag.)
 */
export async function setupNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = setupNotificationsSchema.parse(req.body);
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User email not found in token',
      });
      return;
    }

    const settingsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'settings'
    );
    const existing = await settingsTable.findOne();

    if (existing) {
      await settingsTable.update({
        where: { _id: existing._id as string },
        data: { telegram_notifications: true },
      });
    } else {
      await settingsTable.create({ telegram_notifications: true });
    }

    res.status(200).json({
      success: true,
      data: {
        user_email: user.email,
        chat_id: validatedData.chat_id,
        notification_types: validatedData.notification_types || [
          'budget_alert',
          'goal_alert',
        ],
        setup_completed: true,
        next_steps: [
          'You can now receive Telegram notifications',
          'Set up budget goals with notify_telegram: true',
          'Configure your notification preferences in settings',
        ],
      },
      message: 'Telegram notifications setup completed successfully',
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

    logger.error('Error setting up notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
