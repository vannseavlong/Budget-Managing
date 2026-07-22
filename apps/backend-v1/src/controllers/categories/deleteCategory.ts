import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

/**
 * Delete a category
 */
export async function deleteCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const { id } = req.params;

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

    // Delete the category
    await categoriesTable.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
