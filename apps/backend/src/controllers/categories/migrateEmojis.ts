import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CategoryMigration } from '../../utils/categoryMigration';
import { logger } from '../../utils/logger';

/**
 * Migrate categories to include emoji field
 * This is a one-time migration endpoint
 */
export async function migrateCategoriesEmoji(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    logger.info(
      `Starting category emoji migration for user: ${authenticatedReq.user!.email}`
    );

    // Initialize migration utility
    const migration = new CategoryMigration(googleCredentials);

    // Check current status
    const statusBefore = await migration.verifyMigration(spreadsheetId);

    if (statusBefore.withoutEmoji === 0) {
      res.status(200).json({
        success: true,
        message: 'All categories already have emojis',
        data: {
          total: statusBefore.total,
          alreadyMigrated: statusBefore.withEmoji,
          needsMigration: statusBefore.withoutEmoji,
        },
      });
      return;
    }

    // Perform migration
    await migration.migrateCategoriesToEmoji(spreadsheetId);

    // Verify migration results
    const statusAfter = await migration.verifyMigration(spreadsheetId);

    res.status(200).json({
      success: true,
      message: 'Category emoji migration completed successfully',
      data: {
        before: statusBefore,
        after: statusAfter,
        migrated: statusBefore.withoutEmoji - statusAfter.withoutEmoji,
      },
    });

    logger.info(
      `Category emoji migration completed for user: ${authenticatedReq.user!.email}`
    );
  } catch (error) {
    logger.error('Error during category emoji migration:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Migration failed',
    });
  }
}
