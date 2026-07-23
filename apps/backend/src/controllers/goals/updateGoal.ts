import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { updateGoalSchema, toGoalResponse } from './types';

/** PUT /api/v1/goals/:id — dedupes on `name` if the name is being changed. */
export async function updateGoal(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validatedData = updateGoalSchema.parse(req.body);

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    const existingGoal = await goalsTable.findOne({ where: { _id: id } });

    if (!existingGoal) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    if (validatedData.name && validatedData.name !== existingGoal.name) {
      const conflictingGoals = await goalsTable.findMany({
        where: { name: validatedData.name },
      });

      if (conflictingGoals.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Goal with this name already exists',
        });
        return;
      }
    }

    await goalsTable.update({ where: { _id: id }, data: validatedData });

    const updatedGoal = await goalsTable.findOne({ where: { _id: id } });

    res.status(200).json({
      success: true,
      data: toGoalResponse(updatedGoal as any, email),
      message: 'Goal updated successfully',
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

    logger.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
    });
  }
}
