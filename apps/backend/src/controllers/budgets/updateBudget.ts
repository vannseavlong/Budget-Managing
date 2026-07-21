import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';
import { updateBudgetSchema } from './types';

/**
 * Update an existing budget
 */
export async function updateBudget(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateBudgetSchema.parse(req.body);

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');

    // Check the budget exists (it's already scoped to this user's own sheet)
    const existingBudget = await budgetsTable.findOne({ where: { id } });

    if (!existingBudget) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Check if new year/month conflicts with existing budgets (if year or month is being updated)
    if (
      (validatedData.year &&
        validatedData.year !== (existingBudget.year as number)) ||
      (validatedData.month &&
        validatedData.month !== (existingBudget.month as number))
    ) {
      const newYear = validatedData.year || (existingBudget.year as number);
      const newMonth = validatedData.month || (existingBudget.month as number);

      const conflictingBudgets = await budgetsTable.findMany({
        where: { year: newYear, month: newMonth },
      });

      // Filter out the current budget from conflicts
      const actualConflicts = conflictingBudgets.filter(
        (budget: any) => budget.id !== id
      );

      if (actualConflicts.length > 0) {
        res.status(400).json({
          success: false,
          message: `Budget for ${newYear}/${newMonth} already exists`,
        });
        return;
      }
    }

    // Update the budget
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await budgetsTable.update({ where: { id }, data: updateData });

    // Get updated budget
    const updatedBudget = await budgetsTable.findOne({ where: { id } });

    res.status(200).json({
      success: true,
      data: updatedBudget,
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
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
