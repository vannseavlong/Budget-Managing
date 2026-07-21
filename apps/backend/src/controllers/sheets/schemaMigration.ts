import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { 
  getSchemaStatus, 
  migrateSchema,
  ensureAllSheetsExist 
} from '../../services/googleSheets/schema-migration';

/**
 * Get the current schema status of the user's spreadsheet
 * Shows current version, latest version, and missing sheets
 */
export async function checkSchemaStatus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const spreadsheetId = req.user?.spreadsheetId;

    if (!spreadsheetId) {
      res.status(404).json({
        success: false,
        message: 'No spreadsheet found for user',
      });
      return;
    }

    const status = await getSchemaStatus(spreadsheetId);

    res.status(200).json({
      success: true,
      data: status,
      message: status.isUpToDate
        ? 'Schema is up to date'
        : 'Schema migration available',
    });
  } catch (error) {
    logger.error('Error checking schema status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check schema status',
    });
  }
}

/**
 * Manually trigger schema migration for the user's spreadsheet
 * This is useful if automatic migration fails or for admin purposes
 */
export async function triggerSchemaMigration(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const spreadsheetId = req.user?.spreadsheetId;

    if (!spreadsheetId) {
      res.status(404).json({
        success: false,
        message: 'No spreadsheet found for user',
      });
      return;
    }

    // Ensure all sheets exist first
    await ensureAllSheetsExist(spreadsheetId);
    
    // Then apply any pending migrations
    await migrateSchema(spreadsheetId);

    const updatedStatus = await getSchemaStatus(spreadsheetId);

    res.status(200).json({
      success: true,
      data: updatedStatus,
      message: 'Schema migration completed successfully',
    });
  } catch (error) {
    logger.error('Error triggering schema migration:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to migrate schema',
    });
  }
}
