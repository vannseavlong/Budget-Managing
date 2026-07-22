import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';
import { updateCategorySchema } from './types';

/**
 * Update an existing category
 */
export async function updateCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const categoriesTable = await getUserTable(email, spreadsheetId, 'categories');

    // Check the category exists (it's already scoped to this user's own sheet)
    const existingCategory = await categoriesTable.findOne({ where: { id } });

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Check if new name conflicts with existing categories (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const conflictingCategories = await categoriesTable.findMany({
        where: { name: validatedData.name },
      });

      if (conflictingCategories.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
        return;
      }
    }

    // Update the category
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    await categoriesTable.update({ where: { id }, data: updateData });

    // Get updated category
    const updatedCategory = await categoriesTable.findOne({ where: { id } });

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
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

    logger.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
