import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { createCategorySchema } from './types';
import { toCategoryResponse, CategoryRecord } from './mapper';

/** POST /api/v1/categories */
export async function createCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const validatedData = createCategorySchema.parse(req.body);

    const categoriesTable = await getUserTable(
      email,
      spreadsheetId,
      'categories'
    );

    // Check if a category with this name already exists for this user.
    const existing = await categoriesTable.findMany({
      where: { name: validatedData.name },
    });

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
      return;
    }

    const created = await categoriesTable.create({
      name: validatedData.name,
      emoji: validatedData.emoji,
      color: validatedData.color,
    });

    res.status(201).json({
      success: true,
      data: toCategoryResponse(created as CategoryRecord, email),
      message: 'Category created successfully',
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

    logger.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
    });
  }
}
