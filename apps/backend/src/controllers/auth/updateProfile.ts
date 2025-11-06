import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';

// Validation schema for user profile updates
const updateProfileSchema = z.object({
  telegram_username: z.string().optional(),
  chatId: z.string().optional(),
});

/**
 * Update user profile (telegram fields)
 */
export async function updateProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(user.googleCredentials);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.telegram_username !== undefined) {
      updateData.telegram_username = validatedData.telegram_username;
    }

    if (validatedData.chatId !== undefined) {
      updateData.chatId = validatedData.chatId;
    }

    // Get current user record to get the ID
    const users = await googleSheetsService.find(user.spreadsheetId, 'users', {
      email: user.email,
    });

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const currentUser = users[0];

    // Update user record in the database using the user ID
    await googleSheetsService.update(
      user.spreadsheetId,
      'users',
      currentUser.id as string,
      updateData
    );

    // Get updated user data
    const updatedUsers = await googleSheetsService.find(
      user.spreadsheetId,
      'users',
      { email: user.email }
    );

    const updatedUser = updatedUsers[0];

    res.status(200).json({
      success: true,
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        telegram_username: updatedUser.telegram_username,
        chatId: updatedUser.chatId,
        spreadsheetId: user.spreadsheetId,
      },
      message: 'Profile updated successfully',
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

    logger.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
    });
  }
}
