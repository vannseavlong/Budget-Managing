import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';

/** DELETE /api/v1/categories/:id — categories has no softDelete, so this really removes the row. */
export async function deleteCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

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

    await categoriesTable.delete({ where: { _id: id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
    });
  }
}
