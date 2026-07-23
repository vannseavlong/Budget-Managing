import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { updateCategorySchema } from './types';
import { toCategoryResponse, CategoryRecord } from './mapper';

/** PUT /api/v1/categories/:id */
export async function updateCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const categoriesTable = await getUserTable(
      email,
      spreadsheetId,
      'categories'
    );

    const existingCategory = await categoriesTable.findOne({
      where: { _id: id },
    });

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const conflicting = await categoriesTable.findMany({
        where: { name: validatedData.name },
      });

      if (conflicting.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
        return;
      }
    }

    await categoriesTable.update({ where: { _id: id }, data: validatedData });

    const updatedCategory = await categoriesTable.findOne({
      where: { _id: id },
    });

    res.status(200).json({
      success: true,
      data: toCategoryResponse(updatedCategory as CategoryRecord, email),
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
      message: 'Failed to update category',
    });
  }
}
