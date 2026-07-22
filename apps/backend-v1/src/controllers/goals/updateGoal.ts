import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';
import { updateGoalSchema } from './types';

/**
 * Update an existing goal
 */
export async function updateGoal(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateGoalSchema.parse(req.body);

    const goalsTable = await getUserTable(email, spreadsheetId, 'goals');

    // Check the goal exists (it's already scoped to this user's own sheet)
    const existingGoal = await goalsTable.findOne({ where: { id } });

    if (!existingGoal) {
      res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
      return;
    }

    // Check if new name conflicts with existing goals (if name is being updated)
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

    // Update the goal
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await goalsTable.update({ where: { id }, data: updateData });

    // Get updated goal
    const updatedGoal = await goalsTable.findOne({ where: { id } });

    res.status(200).json({
      success: true,
      data: updatedGoal,
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
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
