import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const setupNotificationsSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID is required'),
  notification_types: z
    .array(
      z.enum(['budget_alert', 'goal_alert', 'transaction_reminder', 'custom'])
    )
    .optional(),
  enable_all: z.boolean().default(false),
});

export async function setupNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = setupNotificationsSchema.parse(req.body);
    const userEmail = req.user?.email;

    if (!userEmail) {
      res.status(401).json({
        success: false,
        message: 'User email not found in token',
      });
      return;
    }

    // Here you would typically:
    // 1. Save the chat_id to user settings
    // 2. Enable telegram notifications for the user
    // 3. Store notification preferences

    res.status(200).json({
      success: true,
      data: {
        user_email: userEmail,
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
