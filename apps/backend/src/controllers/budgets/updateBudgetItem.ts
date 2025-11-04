import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';
import { updateBudgetItemSchema } from './types';

/**
 * Update an existing budget item
 */
export async function updateBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateBudgetItemSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if budget item exists and belongs to this user
    const existingBudgetItem = await googleSheetsService.findById(
      spreadsheetId,
      'budget_items',
      id
    );

    if (
      !existingBudgetItem ||
      existingBudgetItem.user_id !== authenticatedReq.user!.email
    ) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    // If category_id is being updated, verify the new category exists and belongs to this user
    if (
      validatedData.category_id &&
      validatedData.category_id !== existingBudgetItem.category_id
    ) {
      const category = await googleSheetsService.findById(
        spreadsheetId,
        'categories',
        validatedData.category_id
      );

      if (!category || category.user_id !== authenticatedReq.user!.email) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID or category does not belong to user',
        });
        return;
      }

      // Check if budget item for this new category already exists in the same budget
      const conflictingBudgetItems = await googleSheetsService.find(
        spreadsheetId,
        'budget_items',
        {
          user_id: authenticatedReq.user!.email,
          budget_id: existingBudgetItem.budget_id,
          category_id: validatedData.category_id,
        }
      );

      if (conflictingBudgetItems.length > 0) {
        res.status(400).json({
          success: false,
          message:
            'Budget item for this category already exists in this budget',
        });
        return;
      }
    }

    // Update the budget item
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await googleSheetsService.update(
      spreadsheetId,
      'budget_items',
      id,
      updateData
    );

    // Get updated budget item
    const updatedBudgetItem = await googleSheetsService.findById(
      spreadsheetId,
      'budget_items',
      id
    );

    res.status(200).json({
      success: true,
      data: updatedBudgetItem,
      message: 'Budget item updated successfully',
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

    logger.error('Error updating budget item:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
