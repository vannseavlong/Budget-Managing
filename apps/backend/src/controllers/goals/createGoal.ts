import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createGoalSchema } from './types';

/**
 * Create a new goal
 */
export async function createGoal(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validatedData = createGoalSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if goal with same name already exists for this user
    const existingGoals = await googleSheetsService.find(
      spreadsheetId,
      'goals',
      {
        user_id: authenticatedReq.user!.email,
        name: validatedData.name,
      }
    );

    if (existingGoals.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Goal with this name already exists',
      });
      return;
    }

    // Create new goal
    const newGoal = {
      id: uuidv4(),
      name: validatedData.name,
      limit_amount: validatedData.limit_amount,
      period: validatedData.period,
      notify_telegram: validatedData.notify_telegram,
      user_id: authenticatedReq.user!.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into Google Sheets
    await googleSheetsService.insert(spreadsheetId, 'goals', newGoal);

    res.status(201).json({
      success: true,
      data: newGoal,
      message: 'Goal created successfully',
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

    logger.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
