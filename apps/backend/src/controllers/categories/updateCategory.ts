import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if category exists and belongs to this user
    const existingCategory = await googleSheetsService.findById(
      spreadsheetId,
      'categories',
      id
    );

    if (
      !existingCategory ||
      existingCategory.user_id !== authenticatedReq.user!.email
    ) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    // Check if new name conflicts with existing categories (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const conflictingCategories = await googleSheetsService.find(
        spreadsheetId,
        'categories',
        {
          user_id: authenticatedReq.user!.email,
          name: validatedData.name,
        }
      );

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

    await googleSheetsService.update(
      spreadsheetId,
      'categories',
      id,
      updateData
    );

    // Get updated category
    const updatedCategory = await googleSheetsService.findById(
      spreadsheetId,
      'categories',
      id
    );

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
