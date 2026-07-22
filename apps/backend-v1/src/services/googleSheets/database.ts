import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { TableSchema } from './types';
import { v4 as uuidv4 } from 'uuid';
import { createSheet } from './sheets';
import { insert } from './crud';
import { logger } from '../../utils/logger';
import { migrateSchema, ensureAllSheetsExist } from './schema-migration';
import { BASE_SCHEMA } from './schema-versions';

export async function getOrCreateUserDatabase(
  userEmail: string,
  userName?: string
): Promise<string> {
  try {
    const auth = getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });
    const searchResponse = await drive.files.list({
      q: `name contains 'Budget Manager - ${userEmail}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      const existingFile = searchResponse.data.files[0];
      logger.info(
        `Found existing spreadsheet for ${userEmail}: ${existingFile.id}`
      );
      
      // Auto-migrate schema for existing users
      await migrateSchema(existingFile.id!);
      
      return existingFile.id!;
    }

    return await createNewUserDatabase(userEmail, userName);
  } catch (error) {
    logger.error('Error getting/creating user database:', error);
    throw new Error('Failed to get or create user database');
  }
}

/**
 * Find an existing user spreadsheet by email. Returns spreadsheetId or null.
 * This does NOT create a spreadsheet.
 */
export async function findUserSpreadsheetByEmail(
  userEmail: string
): Promise<string | null> {
  try {
    const auth = getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });
    const searchResponse = await drive.files.list({
      q: `name contains 'Budget Manager - ${userEmail}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id || null;
    }

    return null;
  } catch (error) {
    logger.error('Error searching for user spreadsheet:', error);
    return null;
  }
}

export async function createNewUserDatabase(
  userEmail: string,
  userName?: string
): Promise<string> {
  try {
    const authClient = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Create empty spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Budget Manager - ${userEmail}` },
        sheets: [],
      },
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Use the schema migration system to create all sheets
    await ensureAllSheetsExist(spreadsheetId);

    // Create initial user record
    const userId = uuidv4();
    await insert(spreadsheetId, 'users', {
      id: userId,
      name: userName || userEmail.split('@')[0],
      email: userEmail,
      password_hash: '',
      telegram_username: '',
      chatId: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create initial settings record
    await insert(spreadsheetId, 'settings', {
      user_id: userId,
      currency: 'USD',
      language: 'en',
      dark_mode: false,
      telegram_notifications: false,
      telegram_chat_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    logger.info(
      `Created database for user: ${userEmail}, spreadsheetId: ${spreadsheetId}`
    );
    return spreadsheetId;
  } catch (error) {
    logger.error('Error creating user database:', error);
    throw new Error('Failed to create user database');
  }
}

export async function recreateDatabase(
  spreadsheetId: string,
  userEmail: string,
  userName?: string
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets || [];
    for (let i = 1; i < existingSheets.length; i++) {
      const sheet = existingSheets[i];
      if (sheet.properties?.sheetId) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ deleteSheet: { sheetId: sheet.properties.sheetId } }],
          },
        });
      }
    }

    if (existingSheets[0]?.properties?.sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: existingSheets[0].properties.sheetId,
                  title: 'users',
                },
                fields: 'title',
              },
            },
          ],
        },
      });
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'users!A:Z',
      });
    }

    const schema: TableSchema[] = [
      {
        name: 'users',
        columns: [
          'id',
          'name',
          'email',
          'password_hash',
          'telegram_username',
          'chatId',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
      },
      {
        name: 'settings',
        columns: [
          'user_id',
          'currency',
          'language',
          'dark_mode',
          'telegram_notifications',
          'telegram_chat_id',
          'created_at',
          'updated_at',
        ],
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'categories',
        columns: ['id', 'user_id', 'name', 'color', 'created_at', 'updated_at'],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'transactions',
        columns: [
          'id',
          'user_id',
          'name',
          'amount',
          'category_id',
          'category_name',
          'date',
          'time',
          'notes',
          'receipt_url',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
          {
            column: 'category_id',
            referencedTable: 'categories',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'budgets',
        columns: [
          'id',
          'user_id',
          'year',
          'month',
          'income',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'budget_items',
        columns: [
          'id',
          'budget_id',
          'category_id',
          'category_name',
          'amount',
          'spent',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'budget_id',
            referencedTable: 'budgets',
            referencedColumn: 'id',
          },
          {
            column: 'category_id',
            referencedTable: 'categories',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'goals',
        columns: [
          'id',
          'user_id',
          'name',
          'limit_amount',
          'period',
          'notify_telegram',
          'last_notified_at',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'telegram_messages',
        columns: [
          'id',
          'user_id',
          'chat_id',
          'payload',
          'status',
          'error',
          'sent_at',
          'created_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
      {
        name: 'budget_incomes',
        columns: [
          'id',
          'user_id',
          'year',
          'month',
          'amount',
          'source',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
        foreignKeys: [
          {
            column: 'user_id',
            referencedTable: 'users',
            referencedColumn: 'id',
          },
        ],
      },
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `users!A1:${String.fromCharCode(65 + schema[0].columns.length - 1)}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [schema[0].columns] },
    });

    const usersSheetId = 0;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: usersSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: schema[0].columns.length,
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

    for (let i = 1; i < schema.length; i++) {
      await createSheet(spreadsheetId, schema[i]);
    }

    const userId = uuidv4();
    await insert(spreadsheetId, 'users', {
      id: userId,
      name: userName || userEmail.split('@')[0],
      email: userEmail,
      password_hash: '',
      telegram_username: '',
      chatId: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await insert(spreadsheetId, 'settings', {
      user_id: userId,
      currency: 'USD',
      language: 'en',
      dark_mode: false,
      telegram_notifications: false,
      telegram_chat_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    logger.info(
      `Database schema updated for user: ${userEmail}, spreadsheetId: ${spreadsheetId}`
    );
  } catch (error) {
    logger.error('Error recreating database:', error);
    throw new Error('Failed to recreate database with updated schema');
  }
}

export async function createDatabaseSchema(
  spreadsheetId: string
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const schema: Record<string, string[]> = {
      users: [
        'id',
        'name',
        'email',
        'password_hash',
        'created_at',
        'updated_at',
      ],
      settings: [
        'user_id',
        'currency',
        'language',
        'dark_mode',
        'telegram_notifications',
        'telegram_chat_id',
        'created_at',
        'updated_at',
      ],
      categories: [
        'id',
        'user_id',
        'name',
        'color',
        'created_at',
        'updated_at',
      ],
      transactions: [
        'id',
        'user_id',
        'name',
        'amount',
        'category_id',
        'category_name',
        'date',
        'time',
        'notes',
        'receipt_url',
        'created_at',
        'updated_at',
      ],
      budgets: [
        'id',
        'user_id',
        'year',
        'month',
        'income',
        'created_at',
        'updated_at',
      ],
      budget_items: [
        'id',
        'budget_id',
        'category_id',
        'category_name',
        'amount',
        'spent',
        'created_at',
        'updated_at',
      ],
      goals: [
        'id',
        'user_id',
        'name',
        'limit_amount',
        'period',
        'notify_telegram',
        'last_notified_at',
        'created_at',
        'updated_at',
      ],
      telegram_messages: [
        'id',
        'user_id',
        'chat_id',
        'payload',
        'status',
        'error',
        'sent_at',
        'created_at',
      ],
      budget_incomes: [
        'id',
        'user_id',
        'year',
        'month',
        'amount',
        'source',
        'created_at',
        'updated_at',
      ],
    };

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets =
      spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) || [];

    for (const [tableName, headers] of Object.entries(schema)) {
      if (!existingSheets.includes(tableName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: tableName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: headers.length,
                    },
                  },
                },
              },
            ],
          },
        });
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tableName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });

      const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetId = sheetInfo.data.sheets?.find(
        (s) => s.properties?.title === tableName
      )?.properties?.sheetId;
      if (sheetId !== undefined) {
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
                    endColumnIndex: headers.length,
                  },
                  cell: { userEnteredFormat: { textFormat: { bold: true } } },
                  fields: 'userEnteredFormat.textFormat.bold',
                },
              },
              {
                updateSheetProperties: {
                  properties: {
                    sheetId,
                    gridProperties: { frozenRowCount: 1 },
                  },
                  fields: 'gridProperties.frozenRowCount',
                },
              },
            ],
          },
        });
      }
    }

    logger.info(
      `Database schema created/updated for spreadsheet: ${spreadsheetId}`
    );
  } catch (error) {
    logger.error('Error creating database schema:', error);
    throw new Error('Failed to create database schema');
  }
}
