import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { logger } from '../../utils/logger';

export async function validateDatabaseSchema(
  spreadsheetId: string
): Promise<{
  isValid: boolean;
  missingTables: string[];
  existingTables: string[];
  issues: string[];
}> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const requiredTables = [
      'users',
      'settings',
      'categories',
      'transactions',
      'budgets',
      'budget_items',
      'budget_incomes',
      'goals',
      'telegram_messages',
    ];
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTables =
      spreadsheet.data.sheets
        ?.map((sheet) => sheet.properties?.title)
        .filter((t): t is string => Boolean(t)) || [];
    const missingTables = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );
    const issues: string[] = [];

    if (missingTables.length > 0)
      issues.push(`Missing tables: ${missingTables.join(', ')}`);

    for (const table of existingTables.filter((t) =>
      requiredTables.includes(t)
    )) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${table}!A1:Z1`,
        });
        if (!response.data.values || response.data.values.length === 0)
          issues.push(`Table '${table}' has no headers`);
      } catch (error) {
        issues.push(`Cannot read headers from table '${table}'`);
      }
    }

    return {
      isValid: missingTables.length === 0 && issues.length === 0,
      missingTables,
      existingTables: existingTables.filter((t) => requiredTables.includes(t)),
      issues,
    };
  } catch (error) {
    logger.error('Error validating database schema:', error);
    throw new Error('Failed to validate database schema');
  }
}
