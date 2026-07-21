import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
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
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateBudgetItemSchema.parse(req.body);

    // Optimization (unchanged from before this migration): we skip budget
    // ownership validation to reduce API calls — the spreadsheet is already
    // user-specific (from auth token), so budget items in this spreadsheet
    // inherently belong to this user.
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );
    const existingBudgetItem = await budgetItemsTable.findOne({
      where: { id },
    });

    if (!existingBudgetItem) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    // If category_id is being updated, verify the new category exists
    if (
      validatedData.category_id &&
      validatedData.category_id !== existingBudgetItem.category_id
    ) {
      const categoriesTable = await getUserTable(
        email,
        spreadsheetId,
        'categories'
      );
      const category = await categoriesTable.findOne({
        where: { id: validatedData.category_id },
      });

      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID or category does not belong to user',
        });
        return;
      }

      // Check if budget item for this new category already exists in the
      // same budget. (Dropped a `user_id` filter key here that the old
      // code passed even though budget_items has no user_id column — it
      // made this check silently always pass; now it actually runs.)
      const conflictingBudgetItems = await budgetItemsTable.findMany({
        where: {
          budget_id: existingBudgetItem.budget_id,
          category_id: validatedData.category_id,
        },
      });

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

    await budgetItemsTable.update({ where: { id }, data: updateData });

    // Get updated budget item
    const updatedBudgetItem = await budgetItemsTable.findOne({
      where: { id },
    });

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
