import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetResponse } from './mappers';
import { updateBudgetSchema } from './types';

/** PUT /api/v1/budgets/:id */
export async function updateBudget(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validated = updateBudgetSchema.parse(req.body);

    const budgetsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budgets'
    );

    const existing = await budgetsTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Check if the new year/month conflicts with another budget owned by
    // this user (only relevant when year or month is actually changing).
    if (
      (validated.year !== undefined &&
        validated.year !== (existing.year as number)) ||
      (validated.month !== undefined &&
        validated.month !== (existing.month as number))
    ) {
      const newYear = validated.year ?? (existing.year as number);
      const newMonth = validated.month ?? (existing.month as number);

      const conflicting = await budgetsTable.findMany({
        where: { year: newYear, month: newMonth },
      });

      const actualConflicts = conflicting.filter(
        (budget: any) => budget._id !== id
      );

      if (actualConflicts.length > 0) {
        res.status(400).json({
          success: false,
          message: `Budget for ${newYear}/${newMonth} already exists`,
        });
        return;
      }
    }

    await budgetsTable.update({ where: { _id: id }, data: validated });

    const updated = await budgetsTable.findOne({ where: { _id: id } });

    res.status(200).json({
      success: true,
      data: toBudgetResponse(updated as any, user.email),
      message: 'Budget updated successfully',
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

    logger.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
    });
  }
}
