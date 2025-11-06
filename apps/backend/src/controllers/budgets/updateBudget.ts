import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateBudgetSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if budget exists and belongs to this user
    const existingBudget = await googleSheetsService.findById(
      spreadsheetId,
      'budgets',
      id
    );

    if (
      !existingBudget ||
      existingBudget.user_id !== authenticatedReq.user!.email
    ) {
      res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
      return;
    }

    // Check if new year/month conflicts with existing budgets (if year or month is being updated)
    if (
      (validatedData.year &&
        validatedData.year !== parseInt(existingBudget.year as string)) ||
      (validatedData.month &&
        validatedData.month !== parseInt(existingBudget.month as string))
    ) {
      const newYear =
        validatedData.year || parseInt(existingBudget.year as string);
      const newMonth =
        validatedData.month || parseInt(existingBudget.month as string);

      const conflictingBudgets = await googleSheetsService.find(
        spreadsheetId,
        'budgets',
        {
          user_id: authenticatedReq.user!.email,
          year: newYear.toString(),
          month: newMonth.toString(),
        }
      );

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

    await googleSheetsService.update(spreadsheetId, 'budgets', id, updateData);

    // Get updated budget
    const updatedBudget = await googleSheetsService.findById(
      spreadsheetId,
      'budgets',
      id
    );

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
