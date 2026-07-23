import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { createGoalSchema, toGoalResponse } from './types';

/**
 * POST /api/v1/goals — dedupes on `name` within the user's own sheet,
 * ported from backend-v1's createGoal.ts.
 */
export async function createGoal(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;
    const validatedData = createGoalSchema.parse(req.body);

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    const existingGoals = await goalsTable.findMany({
      where: { name: validatedData.name },
    });

    if (existingGoals.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Goal with this name already exists',
      });
      return;
    }

    const created = await goalsTable.create({
      name: validatedData.name,
      limit_amount: validatedData.limit_amount,
      period: validatedData.period,
      notify_telegram: validatedData.notify_telegram,
    });

    res.status(201).json({
      success: true,
      data: toGoalResponse(created as any, email),
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
      message: 'Failed to create goal',
    });
  }
}
