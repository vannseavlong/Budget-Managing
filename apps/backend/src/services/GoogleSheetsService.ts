import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface UserCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface TableSchema {
  name: string;
  columns: string[];
  primaryKey?: string;
  foreignKeys?: {
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
}

// Type for database records - allows any string key with unknown value type
export type DatabaseRecord = Record<string, unknown>;

// Type for filters applied to database queries
export type RecordFilters = Record<string, unknown>;

export class GoogleSheetsService {
  private oauth2Client: OAuth2Client | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for first use
    // This prevents startup errors when credentials are not available
  }

  private initializeIfNeeded(): void {
    if (this.isInitialized) return;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/v1/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error(
        'Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }

    // console.log('Initializing Google Sheets Service:');
    // console.log('Client ID:', clientId ? 'SET' : 'MISSING');
    // console.log('Client Secret:', clientSecret ? 'SET' : 'MISSING');
    // console.log('Redirect URI:', redirectUri ? 'SET' : 'MISSING');

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.isInitialized = true;
  }

  /**
   * Get the oauth2Client with initialization check
   */
  private getAuthenticatedClient(): OAuth2Client {
    this.initializeIfNeeded();

    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    return this.oauth2Client;
  }

  /**
   * Generate Google OAuth URL for user authentication
   */
  getAuthUrl(): string {
    const client = this.getAuthenticatedClient();

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for access tokens
   */
  async getTokens(code: string): Promise<UserCredentials> {
    try {
      const client = this.getAuthenticatedClient();
      const { tokens } = await client.getToken(code);
      return tokens as UserCredentials;
    } catch (error) {
      logger.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Set user credentials for API calls
   */
  setCredentials(credentials: UserCredentials): void {
    const client = this.getAuthenticatedClient();
    client.setCredentials(credentials);
  }

  /**
   * Get or create user's Google Sheets database (persistent across logins)
   */
  async getOrCreateUserDatabase(
    userEmail: string,
    userName?: string
  ): Promise<string> {
    try {
      const drive = google.drive({
        version: 'v3',
        auth: this.getAuthenticatedClient(),
      });

      // Search for existing Budget Manager spreadsheet for this user
      const searchResponse = await drive.files.list({
        q: `name contains 'Budget Manager - ${userEmail}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const existingFile = searchResponse.data.files[0];
        logger.info(
          `Found existing spreadsheet for ${userEmail}: ${existingFile.id}`
        );
        return existingFile.id!;
      }

      // Create new spreadsheet if none exists
      return await this.createNewUserDatabase(userEmail, userName);
    } catch (error) {
      logger.error('Error getting/creating user database:', error);
      throw new Error('Failed to get or create user database');
    }
  }

  /**
   * Create a new Google Sheets database for the user
   */
  async createNewUserDatabase(
    userEmail: string,
    userName?: string
  ): Promise<string> {
    try {
      const authClient = this.getAuthenticatedClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });
      // const drive = google.drive({ version: 'v3', auth: authClient });

      // Create a new spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Budget Manager - ${userEmail}`,
          },
          sheets: [],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;

      // Define the database schema matching the specified structure
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
          columns: [
            'id',
            'user_id',
            'name',
            'emoji', // new emoji column
            'color', // keep color for backward compatibility
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
      ];

      // Create sheets for each table
      for (const table of schema) {
        await this.createSheet(spreadsheetId, table);
      }

      // Insert initial user data
      const userId = uuidv4();
      await this.insertUser(spreadsheetId, {
        id: userId,
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        password_hash: '', // Empty for OAuth users
        telegram_username: '', // Empty initially, will be set when user connects Telegram
        chatId: '', // Empty initially, will be set when user connects Telegram
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Insert default user settings
      await this.insert(spreadsheetId, 'settings', {
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

  /**
   * Create a new sheet (table) in the spreadsheet
   */
  private async createSheet(
    spreadsheetId: string,
    schema: TableSchema
  ): Promise<void> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Add new sheet
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

      // Get the sheetId from the response
      const sheetId =
        addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
      if (!sheetId) {
        throw new Error(`Failed to get sheetId for sheet: ${schema.name}`);
      }

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${schema.name}!A1:${String.fromCharCode(65 + schema.columns.length - 1)}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [schema.columns],
        },
      });

      // Format headers
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

  /**
   * Insert a new record into a table
   */
  async insert(
    spreadsheetId: string,
    tableName: string,
    data: DatabaseRecord
  ): Promise<string> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Generate ID if not provided
      if (!data.id) {
        data.id = uuidv4();
      }

      // Add timestamps
      if (!data.created_at) {
        data.created_at = new Date().toISOString();
      }
      if (!data.updated_at) {
        data.updated_at = new Date().toISOString();
      }

      // Get headers to determine column order
      const headers = await this.getHeaders(spreadsheetId, tableName);
      const values = headers.map((header) => data[header] || '');

      // Append the row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tableName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      logger.info(`Inserted record into ${tableName} with ID: ${data.id}`);
      return data.id as string;
    } catch (error) {
      logger.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find records in a table
   */
  async find(
    spreadsheetId: string,
    tableName: string,
    filters?: RecordFilters
  ): Promise<DatabaseRecord[]> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Get all data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tableName}!A:Z`,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Convert to objects
      let records = dataRows
        .map((row) => {
          const record: DatabaseRecord = {};
          headers.forEach((header, index) => {
            record[header] = row[index] || '';
          });
          return record;
        })
        .filter((record) => record.id); // Filter out empty rows

      // Apply filters
      if (filters) {
        records = records.filter((record) => {
          return Object.entries(filters).every(([key, value]) => {
            return record[key] === value;
          });
        });
      }

      return records;
    } catch (error) {
      logger.error(`Error finding records in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(
    spreadsheetId: string,
    tableName: string,
    id: string
  ): Promise<DatabaseRecord | null> {
    const records = await this.find(spreadsheetId, tableName, { id });
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Update a record
   */
  async update(
    spreadsheetId: string,
    tableName: string,
    id: string,
    data: DatabaseRecord
  ): Promise<boolean> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Find the row index
      const records = await this.find(spreadsheetId, tableName);
      const recordIndex = records.findIndex((record) => record.id === id);

      if (recordIndex === -1) {
        throw new Error(`Record with ID ${id} not found in ${tableName}`);
      }

      // Add updated timestamp
      data.updated_at = new Date().toISOString();

      // Get headers and prepare values
      const headers = await this.getHeaders(spreadsheetId, tableName);
      const existingRecord = records[recordIndex];
      const updatedRecord = { ...existingRecord, ...data };
      const values = headers.map((header) => updatedRecord[header] || '');

      // Update the row (recordIndex + 2 because of 0-indexing and header row)
      const rowNumber = recordIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tableName}!A${rowNumber}:Z${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });

      logger.info(`Updated record in ${tableName} with ID: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error updating record in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(
    spreadsheetId: string,
    tableName: string,
    id: string
  ): Promise<boolean> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Find the row index
      const records = await this.find(spreadsheetId, tableName);
      const recordIndex = records.findIndex((record) => record.id === id);

      if (recordIndex === -1) {
        throw new Error(`Record with ID ${id} not found in ${tableName}`);
      }

      // Get sheet ID
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === tableName
      );

      if (!sheet?.properties?.sheetId) {
        throw new Error(`Sheet ${tableName} not found`);
      }

      // Delete the row (recordIndex + 1 because of header row)
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

  /**
   * Get headers from a sheet
   */
  private async getHeaders(
    spreadsheetId: string,
    tableName: string
  ): Promise<string[]> {
    const sheets = google.sheets({
      version: 'v4',
      auth: this.getAuthenticatedClient(),
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tableName}!A1:Z1`,
    });

    return response.data.values?.[0] || [];
  }

  /**
   * Ensure the categories sheet has the expected columns (adds emoji column if missing)
   * This is idempotent and safe to call for existing spreadsheets.
   */
  async ensureCategoriesSchema(spreadsheetId: string): Promise<void> {
    const sheets = google.sheets({
      version: 'v4',
      auth: this.getAuthenticatedClient(),
    });

    try {
      const headers = await this.getHeaders(spreadsheetId, 'categories');

      // If no headers found, the sheet may not exist yet; create it with the proper schema
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
        await this.createSheet(spreadsheetId, schema);
        return;
      }

      const required = ['emoji'];
      const missing = required.filter((c) => !headers.includes(c));
      if (missing.length === 0) return;

      // Append missing headers to end of header row
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

  /**
   * Insert user data
   */
  private async insertUser(
    spreadsheetId: string,
    userData: DatabaseRecord
  ): Promise<void> {
    await this.insert(spreadsheetId, 'users', userData);
  }

  /**
   * Check if user's spreadsheet exists and is accessible
   */
  async validateUserDatabase(spreadsheetId: string): Promise<boolean> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });
      await sheets.spreadsheets.get({ spreadsheetId });
      return true;
    } catch (error) {
      logger.error('Error validating user database:', error);
      return false;
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<{ email: string; name: string }> {
    try {
      const client = this.getAuthenticatedClient();
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const response = await oauth2.userinfo.get();

      // Log the full response to debug
      logger.info('Google userinfo response:', response.data);

      // Try to get the name from multiple possible fields
      const name =
        response.data.name ||
        response.data.given_name ||
        response.data.email!.split('@')[0];

      return {
        email: response.data.email!,
        name: name,
      };
    } catch (error) {
      logger.error('Error getting user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  /**
   * Update user's Telegram information in the users table
   */
  async updateUserTelegramInfo(
    userEmail: string,
    telegramUsername: string,
    chatId: string
  ): Promise<void> {
    try {
      // Find the user's spreadsheet
      const userSpreadsheetId = await this.findUserSpreadsheet(userEmail);

      if (!userSpreadsheetId) {
        logger.warn(`No spreadsheet found for user: ${userEmail}`);
        return;
      }

      // Find the user record first
      const users = await this.find(userSpreadsheetId, 'users');
      const userRecord = users.find(
        (user: DatabaseRecord) => user.email === userEmail
      );

      if (!userRecord) {
        logger.warn(`User record not found for email: ${userEmail}`);
        return;
      }

      // Update the user record with Telegram info
      const updateData = {
        telegram_username: telegramUsername,
        chatId: chatId,
        updated_at: new Date().toISOString(),
      };

      await this.update(
        userSpreadsheetId,
        'users',
        userRecord.id as string,
        updateData
      );

      logger.info('✅ User Telegram info updated in Google Sheets', {
        userEmail,
        telegramUsername,
        chatId,
      });
    } catch (error) {
      logger.error('❌ Error updating user Telegram info:', error);
      throw error;
    }
  }

  /**
   * Find user's spreadsheet by email
   */
  private async findUserSpreadsheet(userEmail: string): Promise<string | null> {
    try {
      // This would typically search through available spreadsheets
      // For now, we'll use a simple approach - check if there's a stored spreadsheet ID
      // In a real implementation, you might store user-spreadsheet mappings in a separate service

      // For development, we can use the current user's credentials to find their own spreadsheet
      const userInfo = await this.getUserInfo();
      if (userInfo.email === userEmail) {
        // This is the current authenticated user, we can use their spreadsheet
        return await this.getOrCreateUserDatabase(userEmail, userInfo.name);
      }

      logger.warn(
        `Cannot find spreadsheet for user ${userEmail} - not the authenticated user`
      );
      return null;
    } catch (error) {
      logger.error('Error finding user spreadsheet:', error);
      return null;
    }
  }

  /**
   * Recreate database with updated schema for existing spreadsheet
   */
  async recreateDatabase(
    spreadsheetId: string,
    userEmail: string,
    userName?: string
  ): Promise<void> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Get existing spreadsheet
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

      // Delete all existing sheets except the first one (to keep the spreadsheet)
      const existingSheets = spreadsheet.data.sheets || [];
      for (let i = 1; i < existingSheets.length; i++) {
        const sheet = existingSheets[i];
        if (sheet.properties?.sheetId) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  deleteSheet: {
                    sheetId: sheet.properties.sheetId,
                  },
                },
              ],
            },
          });
        }
      }

      // Clear the first sheet and rename it to 'users'
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

        // Clear existing content
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: 'users!A:Z',
        });
      }

      // Define the updated database schema
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
          columns: [
            'id',
            'user_id',
            'name',
            'color',
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
      ];

      // Setup the users sheet (already exists, just add headers and formatting)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `users!A1:${String.fromCharCode(65 + schema[0].columns.length - 1)}1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [schema[0].columns],
        },
      });

      // Apply blue header formatting to users table
      const usersSheetId = 0; // Users sheet is typically the first sheet (ID = 0)
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

      // Create remaining sheets
      for (let i = 1; i < schema.length; i++) {
        await this.createSheet(spreadsheetId, schema[i]);
      }

      // Insert initial user data with correct schema
      const userId = uuidv4();
      await this.insertUser(spreadsheetId, {
        id: userId,
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        password_hash: '', // Empty for OAuth users
        telegram_username: '', // Empty initially, will be set when user connects Telegram
        chatId: '', // Empty initially, will be set when user connects Telegram
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Insert default user settings
      await this.insert(spreadsheetId, 'settings', {
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

  /**
   * Create database schema for existing spreadsheet
   */
  async createDatabaseSchema(spreadsheetId: string): Promise<void> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      // Define the MMM database schema
      const schema = {
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
      };

      // Get current spreadsheet info
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const existingSheets =
        spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) || [];

      // Create sheets that don't exist and set up headers
      for (const [tableName, headers] of Object.entries(schema)) {
        if (!existingSheets.includes(tableName)) {
          // Create new sheet
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

        // Set headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tableName}!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });

        // Format header row (bold, freeze)
        const sheetInfo = await sheets.spreadsheets.get({
          spreadsheetId,
        });
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
                    cell: {
                      userEnteredFormat: {
                        textFormat: {
                          bold: true,
                        },
                      },
                    },
                    fields: 'userEnteredFormat.textFormat.bold',
                  },
                },
                {
                  updateSheetProperties: {
                    properties: {
                      sheetId,
                      gridProperties: {
                        frozenRowCount: 1,
                      },
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

  /**
   * Validate if database schema is properly set up
   */
  async validateDatabaseSchema(spreadsheetId: string): Promise<{
    isValid: boolean;
    missingTables: string[];
    existingTables: string[];
    issues: string[];
  }> {
    try {
      const sheets = google.sheets({
        version: 'v4',
        auth: this.getAuthenticatedClient(),
      });

      const requiredTables = [
        'users',
        'settings',
        'categories',
        'transactions',
        'budgets',
        'budget_items',
        'goals',
        'telegram_messages',
      ];

      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const existingTables =
        spreadsheet.data.sheets
          ?.map((sheet) => sheet.properties?.title)
          .filter((title): title is string => Boolean(title)) || [];
      const missingTables = requiredTables.filter(
        (table) => !existingTables.includes(table)
      );
      const issues: string[] = [];

      // Check if all required tables exist
      if (missingTables.length > 0) {
        issues.push(`Missing tables: ${missingTables.join(', ')}`);
      }

      // Check if tables have proper headers (sample check)
      for (const table of existingTables.filter((t) =>
        requiredTables.includes(t)
      )) {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${table}!A1:Z1`,
          });

          if (!response.data.values || response.data.values.length === 0) {
            issues.push(`Table '${table}' has no headers`);
          }
        } catch (error) {
          issues.push(`Cannot read headers from table '${table}'`);
        }
      }

      return {
        isValid: missingTables.length === 0 && issues.length === 0,
        missingTables,
        existingTables: existingTables.filter((t) =>
          requiredTables.includes(t)
        ),
        issues,
      };
    } catch (error) {
      logger.error('Error validating database schema:', error);
      throw new Error('Failed to validate database schema');
    }
  }
}
