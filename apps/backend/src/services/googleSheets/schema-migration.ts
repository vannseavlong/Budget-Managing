/**
 * Schema Migration Service
 * Handles automatic schema updates for existing users
 * and ensures new users get the latest schema
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { logger } from '../../utils/logger';
import {
  BASE_SCHEMA,
  CURRENT_SCHEMA_VERSION,
  SCHEMA_MIGRATIONS,
  SchemaMigration,
} from './schema-versions';

/**
 * Check if a sheet exists in the spreadsheet
 */
async function sheetExists(
  spreadsheetId: string,
  sheetName: string
): Promise<boolean> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets =
      spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) || [];
    return existingSheets.includes(sheetName);
  } catch (error) {
    logger.error(`Error checking if sheet ${sheetName} exists:`, error);
    return false;
  }
}

/**
 * Get current headers (column names) of a sheet
 */
async function getSheetHeaders(
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:ZZ1`, // Read first row (headers)
    });
    return response.data.values?.[0] || [];
  } catch (error) {
    logger.error(`Error getting headers for sheet ${sheetName}:`, error);
    return [];
  }
}

/**
 * Create a new sheet with headers and formatting
 */
async function createSheet(
  spreadsheetId: string,
  sheetName: string,
  columns: string[]
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Add the sheet
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: columns.length,
                  frozenRowCount: 1, // Freeze header row
                },
              },
            },
          },
        ],
      },
    });

    const sheetId =
      addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (sheetId === undefined) {
      throw new Error(`Failed to get sheetId for ${sheetName}`);
    }

    // Set headers
    const columnLetter = String.fromCharCode(65 + columns.length - 1); // A=65
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${columnLetter}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [columns] },
    });

    // Format header row (blue background, white text, bold)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: columns.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });

    logger.info(`Created new sheet: ${sheetName} with ${columns.length} columns`);
  } catch (error) {
    logger.error(`Error creating sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Add new columns to an existing sheet
 */
async function addColumnsToSheet(
  spreadsheetId: string,
  sheetName: string,
  newColumns: string[]
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get current headers
    const currentHeaders = await getSheetHeaders(spreadsheetId, sheetName);
    
    // Filter out columns that already exist
    const columnsToAdd = newColumns.filter(
      (col) => !currentHeaders.includes(col)
    );

    if (columnsToAdd.length === 0) {
      logger.info(`No new columns to add to ${sheetName}`);
      return;
    }

    // Append new column headers
    const updatedHeaders = [...currentHeaders, ...columnsToAdd];
    const columnLetter = String.fromCharCode(65 + updatedHeaders.length - 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${columnLetter}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedHeaders] },
    });

    // Get sheetId for formatting
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    )?.properties?.sheetId;

    if (sheetId !== undefined) {
      // Format the new header cells to match existing style
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: currentHeaders.length,
                  endColumnIndex: updatedHeaders.length,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }

    logger.info(
      `Added ${columnsToAdd.length} new columns to ${sheetName}: ${columnsToAdd.join(', ')}`
    );
  } catch (error) {
    logger.error(`Error adding columns to sheet ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Get the current schema version stored in the spreadsheet
 * Uses a hidden 'schema_version' sheet to track version
 */
async function getCurrentSchemaVersion(
  spreadsheetId: string
): Promise<number> {
  try {
    const exists = await sheetExists(spreadsheetId, 'schema_version');
    if (!exists) {
      return 1; // Default to version 1 if no version sheet exists
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'schema_version!B1', // Version number in cell B1
    });

    const version = parseInt(response.data.values?.[0]?.[0] || '1', 10);
    return isNaN(version) ? 1 : version;
  } catch (error) {
    logger.error('Error getting schema version:', error);
    return 1;
  }
}

/**
 * Update the schema version in the spreadsheet
 */
async function updateSchemaVersion(
  spreadsheetId: string,
  version: number
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const exists = await sheetExists(spreadsheetId, 'schema_version');
    
    if (!exists) {
      // Create the version tracking sheet (hidden)
      const addResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'schema_version',
                  hidden: true, // Hide from users
                  gridProperties: {
                    rowCount: 10,
                    columnCount: 2,
                  },
                },
              },
            },
          ],
        },
      });

      // Set headers and version
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'schema_version!A1:B1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Version', version.toString()]],
        },
      });
    } else {
      // Update existing version
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'schema_version!B1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[version.toString()]],
        },
      });
    }

    logger.info(`Updated schema version to ${version}`);
  } catch (error) {
    logger.error('Error updating schema version:', error);
    throw error;
  }
}

/**
 * Apply a single migration to the spreadsheet
 */
async function applyMigration(
  spreadsheetId: string,
  migration: SchemaMigration
): Promise<void> {
  logger.info(
    `Applying migration v${migration.version}: ${migration.description}`
  );

  // Create new sheets
  if (migration.newSheets && migration.newSheets.length > 0) {
    for (const sheetName of migration.newSheets) {
      const exists = await sheetExists(spreadsheetId, sheetName);
      if (!exists) {
        const columns = BASE_SCHEMA[sheetName];
        if (columns) {
          await createSheet(spreadsheetId, sheetName, columns);
        }
      } else {
        logger.info(`Sheet ${sheetName} already exists, skipping creation`);
      }
    }
  }

  // Update existing sheets with new columns
  if (migration.sheetUpdates && migration.sheetUpdates.length > 0) {
    for (const update of migration.sheetUpdates) {
      const exists = await sheetExists(spreadsheetId, update.sheetName);
      if (exists) {
        await addColumnsToSheet(
          spreadsheetId,
          update.sheetName,
          update.newColumns
        );
      } else {
        logger.warn(
          `Sheet ${update.sheetName} does not exist, skipping column updates`
        );
      }
    }
  }

  logger.info(`Migration v${migration.version} completed successfully`);
}

/**
 * Main migration function - automatically updates schema to latest version
 * Call this whenever a user logs in or accesses their spreadsheet
 */
export async function migrateSchema(spreadsheetId: string): Promise<void> {
  try {
    const currentVersion = await getCurrentSchemaVersion(spreadsheetId);
    logger.info(`Current schema version: ${currentVersion}`);
    logger.info(`Target schema version: ${CURRENT_SCHEMA_VERSION}`);

    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      logger.info('Schema is up to date, no migration needed');
      return;
    }

    // Apply all migrations from current version to latest
    for (const migration of SCHEMA_MIGRATIONS) {
      if (migration.version > currentVersion) {
        await applyMigration(spreadsheetId, migration);
        await updateSchemaVersion(spreadsheetId, migration.version);
      }
    }

    logger.info(
      `Schema migration completed: v${currentVersion} → v${CURRENT_SCHEMA_VERSION}`
    );
  } catch (error) {
    logger.error('Error during schema migration:', error);
    throw new Error('Failed to migrate schema');
  }
}

/**
 * Ensure all required sheets exist (for new users or missing sheets)
 * This creates any missing sheets without affecting existing data
 */
export async function ensureAllSheetsExist(
  spreadsheetId: string
): Promise<void> {
  try {
    logger.info('Ensuring all required sheets exist...');

    for (const [sheetName, columns] of Object.entries(BASE_SCHEMA)) {
      const exists = await sheetExists(spreadsheetId, sheetName);
      if (!exists) {
        await createSheet(spreadsheetId, sheetName, columns);
      }
    }

    // Set schema version if not already set
    const currentVersion = await getCurrentSchemaVersion(spreadsheetId);
    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      await updateSchemaVersion(spreadsheetId, CURRENT_SCHEMA_VERSION);
    }

    logger.info('All required sheets verified/created');
  } catch (error) {
    logger.error('Error ensuring sheets exist:', error);
    throw error;
  }
}

/**
 * Get spreadsheet schema status for debugging/admin
 */
export async function getSchemaStatus(spreadsheetId: string): Promise<{
  currentVersion: number;
  latestVersion: number;
  isUpToDate: boolean;
  missingSheets: string[];
}> {
  const currentVersion = await getCurrentSchemaVersion(spreadsheetId);
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets =
    spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title || '') ||
    [];

  const requiredSheets = Object.keys(BASE_SCHEMA);
  const missingSheets = requiredSheets.filter(
    (sheet) => !existingSheets.includes(sheet)
  );

  return {
    currentVersion,
    latestVersion: CURRENT_SCHEMA_VERSION,
    isUpToDate: currentVersion >= CURRENT_SCHEMA_VERSION && missingSheets.length === 0,
    missingSheets,
  };
}
