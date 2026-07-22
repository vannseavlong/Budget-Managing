import { google } from 'googleapis';
import { getAuthenticatedClient } from './client';
import { DatabaseRecord, RecordFilters } from './types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export async function getHeaders(
  spreadsheetId: string,
  tableName: string
): Promise<string[]> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tableName}!A1:Z1`,
  });
  return response.data.values?.[0] || [];
}

export async function insert(
  spreadsheetId: string,
  tableName: string,
  data: DatabaseRecord
): Promise<string> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    if (!data.id) data.id = uuidv4();
    if (!data.created_at) data.created_at = new Date().toISOString();
    if (!data.updated_at) data.updated_at = new Date().toISOString();

    const headers = await getHeaders(spreadsheetId, tableName);
    const values = headers.map((header) => data[header] || '');

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tableName}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    logger.info(`Inserted record into ${tableName} with ID: ${data.id}`);
    return data.id as string;
  } catch (error) {
    logger.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
}

export async function find(
  spreadsheetId: string,
  tableName: string,
  filters?: RecordFilters
): Promise<DatabaseRecord[]> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tableName}!A:Z`,
    });
    const rows = response.data.values || [];
    if (rows.length === 0) return [];
    const headers = rows[0];
    const dataRows = rows.slice(1);

    let records = dataRows
      .map((row) => {
        const record: DatabaseRecord = {};
        headers.forEach((header, index) => {
          record[header] = row[index] || '';
        });
        return record;
      })
      .filter((record) => record.id);

    if (filters) {
      records = records.filter((record) =>
        Object.entries(filters).every(([key, value]) => record[key] === value)
      );
    }

    return records;
  } catch (error) {
    logger.error(`Error finding records in ${tableName}:`, error);
    throw error;
  }
}

export async function findById(
  spreadsheetId: string,
  tableName: string,
  id: string
): Promise<DatabaseRecord | null> {
  const records = await find(spreadsheetId, tableName, { id });
  return records.length > 0 ? records[0] : null;
}

export async function update(
  spreadsheetId: string,
  tableName: string,
  id: string,
  data: DatabaseRecord
): Promise<boolean> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const records = await find(spreadsheetId, tableName);
    const recordIndex = records.findIndex((record) => record.id === id);
    if (recordIndex === -1)
      throw new Error(`Record with ID ${id} not found in ${tableName}`);
    data.updated_at = new Date().toISOString();
    const headers = await getHeaders(spreadsheetId, tableName);
    const existingRecord = records[recordIndex];
    const updatedRecord = { ...existingRecord, ...data };
    const values = headers.map((header) => updatedRecord[header] || '');
    const rowNumber = recordIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tableName}!A${rowNumber}:Z${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [values] },
    });
    logger.info(`Updated record in ${tableName} with ID: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error updating record in ${tableName}:`, error);
    throw error;
  }
}

export async function remove(
  spreadsheetId: string,
  tableName: string,
  id: string
): Promise<boolean> {
  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const records = await find(spreadsheetId, tableName);
    const recordIndex = records.findIndex((record) => record.id === id);
    if (recordIndex === -1)
      throw new Error(`Record with ID ${id} not found in ${tableName}`);

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === tableName
    );
    if (!sheet?.properties?.sheetId)
      throw new Error(`Sheet ${tableName} not found`);

    const rowIndex = recordIndex + 1;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    logger.info(`Deleted record from ${tableName} with ID: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting record from ${tableName}:`, error);
    throw error;
  }
}
