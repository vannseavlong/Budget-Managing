import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { TableSchema } from './types';
import { logger } from '../../utils/logger';

export async function ensureTableExists(
  spreadsheetId: string,
  table: { name: string; columns: string[] }
) {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existing =
      spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
    if (!existing.includes(table.name)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: table.name,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: table.columns.length,
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
      range: `${table.name}!A1:${String.fromCharCode(64 + table.columns.length)}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [table.columns] },
    });

    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = sheetInfo.data.sheets?.find(
      (s) => s.properties?.title === table.name
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
                  endColumnIndex: table.columns.length,
                },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: 'userEnteredFormat.textFormat.bold',
              },
            },
            {
              updateSheetProperties: {
                properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
                fields: 'gridProperties.frozenRowCount',
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    logger.error(`Error ensuring table ${table.name} exists:`, error);
    throw error;
  }
}

export async function createSheet(
  spreadsheetId: string,
  schema: TableSchema
): Promise<void> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: schema.name,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: schema.columns.length,
                },
              },
            },
          },
        ],
      },
    });

    const sheetId =
      addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (!sheetId)
      throw new Error(`Failed to get sheetId for sheet: ${schema.name}`);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${schema.name}!A1:${String.fromCharCode(65 + schema.columns.length - 1)}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [schema.columns] },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: schema.columns.length,
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
  } catch (error) {
    logger.error(`Error creating sheet ${schema.name}:`, error);
    throw error;
  }
}

export async function ensureCategoriesSchema(
  spreadsheetId: string
): Promise<void> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `categories!A1:Z1`,
    });
    const headers = res.data.values?.[0] || [];
    if (!headers || headers.length === 0) {
      const schema: TableSchema = {
        name: 'categories',
        columns: [
          'id',
          'user_id',
          'name',
          'emoji',
          'color',
          'created_at',
          'updated_at',
        ],
        primaryKey: 'id',
      };
      await createSheet(spreadsheetId, schema);
      return;
    }
    const required = ['emoji'];
    const missing = required.filter((c) => !headers.includes(c));
    if (missing.length === 0) return;
    const newHeaders = [...headers, ...missing];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `categories!A1:Z1`,
      valueInputOption: 'RAW',
      requestBody: { values: [newHeaders] },
    });
    logger.info(`Added missing category columns: ${missing.join(', ')}`);
  } catch (error) {
    logger.error('Error ensuring categories schema:', error);
    throw error;
  }
}
