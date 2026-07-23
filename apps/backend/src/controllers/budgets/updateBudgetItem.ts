import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetItemResponse } from './mappers';
import { updateBudgetItemSchema } from './types';

/**
 * PUT /api/v1/budgets/items/:id
 *
 * Ownership of the budget item is implied by it living in this user's own
 * spreadsheet (actorSheetId scoping) — no separate budget-ownership lookup,
 * same optimization backend-v1 made.
 */
export async function updateBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validated = updateBudgetItemSchema.parse(req.body);

    const budgetItemsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_items'
    );

    const existing = await budgetItemsTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Budget item not found',
      });
      return;
    }

    if (
      validated.category_id &&
      validated.category_id !== existing.category_id
    ) {
      const categoriesTable = await getUserTable(
        user.email,
        user.spreadsheetId,
        'categories'
      );
      const category = await categoriesTable.findOne({
        where: { _id: validated.category_id },
      });

      if (!category) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID or category does not belong to user',
        });
        return;
      }

      const conflicting = await budgetItemsTable.findMany({
        where: {
          budget_id: existing.budget_id,
          category_id: validated.category_id,
        },
      });

      if (conflicting.length > 0) {
        res.status(400).json({
          success: false,
          message:
            'Budget item for this category already exists in this budget',
        });
        return;
      }
    }

    await budgetItemsTable.update({ where: { _id: id }, data: validated });

    const updated = await budgetItemsTable.findOne({ where: { _id: id } });

    res.status(200).json({
      success: true,
      data: toBudgetItemResponse(updated as any, user.email),
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
      message: 'Failed to update budget item',
    });
  }
}
