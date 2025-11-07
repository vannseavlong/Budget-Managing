import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

interface CategoryData {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Color to emoji mapping for migration
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

/**
 * Get all categories for the authenticated user
 */
export async function getCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Ensure categories sheet has emoji column for migration
    await googleSheetsService.ensureCategoriesSchema(spreadsheetId);

    // Get all categories for this user
    const categories = await googleSheetsService.find(
      spreadsheetId,
      'categories',
      { user_id: authenticatedReq.user!.email } // Filter by user
    );

    // Migration logic: Add emoji to categories that don't have one
    const updatedCategories = await Promise.all(
      categories.map(async (category) => {
        const categoryData = category as unknown as CategoryData;

        // If category doesn't have emoji, generate one from color or name
        if (!categoryData.emoji) {
          let emoji = '📂'; // Default

          // Try to get emoji from color first
          if (categoryData.color && colorToEmojiMap[categoryData.color]) {
            emoji = colorToEmojiMap[categoryData.color];
          } else if (categoryData.name) {
            // Fallback to name-based emoji
            emoji = getEmojiFromName(categoryData.name);
          }

          // Update the category in Google Sheets
          try {
            await googleSheetsService.update(
              spreadsheetId,
              'categories',
              categoryData.id,
              { emoji }
            );

            // Return updated category
            return { ...categoryData, emoji };
          } catch (updateError) {
            logger.error('Error updating category with emoji:', updateError);
            // Return category with emoji but don't fail the whole request
            return { ...categoryData, emoji };
          }
        }

        return categoryData;
      })
    );

    res.status(200).json({
      success: true,
      data: updatedCategories,
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
