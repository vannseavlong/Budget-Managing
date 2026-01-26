/**
 * Category Migration Utility
 * Helps migrate existing categories from color-only to emoji+color format
 */

import { UserCredentials } from '../services/googleSheets/types';
import { logger } from './logger';
import { createCategoryService } from '../services/googleSheets/endpoints/categories/createCategoryService';
import { updateCategoryService } from '../services/googleSheets/endpoints/categories/updateCategoryService';

// Color to emoji mapping
const colorToEmojiMap: Record<string, string> = {
  '#FF6B6B': '🍽️', // Red - Food & Dining
  '#4ECDC4': '🚗', // Teal - Transportation
  '#FFD93D': '💡', // Yellow - Bills & Utilities
  '#6BCF7F': '🛍️', // Green - Shopping
  '#4D96FF': '🎬', // Blue - Entertainment
  '#FF6B9D': '🏥', // Pink - Healthcare
  '#C44569': '📚', // Purple - Education
  '#F8B500': '💰', // Orange - Finance
  '#54A0FF': '🏠', // Light Blue - Home
  '#5F27CD': '✈️', // Dark Purple - Travel
  '#FF9F43': '🎯', // Orange - Goals
  '#8395A7': '📂', // Gray - Other
  '#3867D6': '💳', // Blue - Credit Card
  '#20BF6B': '⛽', // Green - Gas
  '#FF9FF3': '📱', // Pink - Technology
};

// Get emoji from category name (fallback method)
const getEmojiFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes('food') ||
    lowerName.includes('dining') ||
    lowerName.includes('restaurant')
  )
    return '🍽️';
  if (
    lowerName.includes('transport') ||
    lowerName.includes('car') ||
    lowerName.includes('gas')
  )
    return '🚗';
  if (
    lowerName.includes('bill') ||
    lowerName.includes('utilities') ||
    lowerName.includes('electric')
  )
    return '💡';
  if (
    lowerName.includes('shop') ||
    lowerName.includes('store') ||
    lowerName.includes('retail')
  )
    return '🛍️';
  if (
    lowerName.includes('entertainment') ||
    lowerName.includes('movie') ||
    lowerName.includes('fun')
  )
    return '🎬';
  if (
    lowerName.includes('health') ||
    lowerName.includes('medical') ||
    lowerName.includes('doctor')
  )
    return '🏥';
  if (
    lowerName.includes('education') ||
    lowerName.includes('school') ||
    lowerName.includes('book')
  )
    return '📚';
  if (
    lowerName.includes('finance') ||
    lowerName.includes('bank') ||
    lowerName.includes('money')
  )
    return '💰';
  if (
    lowerName.includes('home') ||
    lowerName.includes('house') ||
    lowerName.includes('rent')
  )
    return '🏠';
  if (
    lowerName.includes('travel') ||
    lowerName.includes('vacation') ||
    lowerName.includes('trip')
  )
    return '✈️';
  if (
    lowerName.includes('goal') ||
    lowerName.includes('saving') ||
    lowerName.includes('target')
  )
    return '🎯';
  return '📂'; // Default folder emoji
};

interface CategoryRecord {
  id: string;
  name: string;
  color?: string;
  emoji?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Minimal interface for the category-related service objects we use
// keep method shapes narrow to satisfy linting and provide clear intent
// (we don't import this type from the shared module because these endpoint
// wrappers are plain objects with a small subset of the full API)
type CategoryServiceLike = {
  setCredentials?: (c: UserCredentials) => void;
  ensureCategoriesSchema?: (spreadsheetId: string) => Promise<void>;
  find: (
    spreadsheetId: string,
    table: string,
    filters?: Record<string, unknown>
  ) => Promise<unknown[]>;
  update: (
    spreadsheetId: string,
    table: string,
    id: string,
    data: Record<string, unknown>
  ) => Promise<void>;
};

/**
 * Migrate categories to include emoji column
 */
export class CategoryMigration {
  private createSvc: CategoryServiceLike =
    createCategoryService as unknown as CategoryServiceLike;
  private updateSvc: CategoryServiceLike =
    updateCategoryService as unknown as CategoryServiceLike;

  constructor(googleCredentials: UserCredentials) {
    // Set credentials on the small service objects we depend on
    if (this.createSvc.setCredentials)
      this.createSvc.setCredentials(googleCredentials);
    if (this.updateSvc.setCredentials)
      this.updateSvc.setCredentials(googleCredentials);
  }

  /**
   * Add emoji column to existing categories
   * This function should be called once to migrate existing data
   */
  async migrateCategoriesToEmoji(spreadsheetId: string): Promise<void> {
    try {
      logger.info('Starting category emoji migration...');

      // Ensure schema present (adds emoji header if missing)
      await this.createSvc.ensureCategoriesSchema!(spreadsheetId);

      // Get all categories
      const categories = await this.createSvc.find(
        spreadsheetId,
        'categories',
        {}
      );

      logger.info(`Found ${categories.length} categories to migrate`);

      let migrated = 0;
      let skipped = 0;

      // Process each category
      for (const category of categories) {
        const categoryData = category as unknown as CategoryRecord;

        // Skip if already has emoji
        if (categoryData.emoji) {
          skipped++;
          continue;
        }

        // Generate emoji from color or name
        let emoji = '📂'; // Default

        if (categoryData.color && colorToEmojiMap[categoryData.color]) {
          emoji = colorToEmojiMap[categoryData.color];
        } else if (categoryData.name) {
          emoji = getEmojiFromName(categoryData.name);
        }

        // Update the category with emoji
        try {
          await this.updateSvc.update(
            spreadsheetId,
            'categories',
            categoryData.id,
            { emoji }
          );

          migrated++;
          logger.info(
            `Migrated category "${categoryData.name}" with emoji ${emoji}`
          );
        } catch (updateError) {
          logger.error(
            `Failed to update category ${categoryData.id}:`,
            updateError
          );
        }
      }

      logger.info(
        `Migration completed: ${migrated} migrated, ${skipped} skipped`
      );
    } catch (error) {
      logger.error('Error during category migration:', error);
      throw error;
    }
  }

  /**
   * Verify migration status
   */
  async verifyMigration(spreadsheetId: string): Promise<{
    total: number;
    withEmoji: number;
    withoutEmoji: number;
  }> {
    try {
      await this.createSvc.ensureCategoriesSchema!(spreadsheetId);
      const categories = await this.createSvc.find(
        spreadsheetId,
        'categories',
        {}
      );

      let withEmoji = 0;
      let withoutEmoji = 0;

      for (const category of categories) {
        const categoryData = category as unknown as CategoryRecord;
        if (categoryData.emoji) {
          withEmoji++;
        } else {
          withoutEmoji++;
        }
      }

      return {
        total: categories.length,
        withEmoji,
        withoutEmoji,
      };
    } catch (error) {
      logger.error('Error verifying migration:', error);
      throw error;
    }
  }
}
