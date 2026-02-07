/**
 * Google Sheets OTP Database Adapter
 * Adapts the OTP authentication system to use Google Sheets instead of PostgreSQL
 */

import { google } from 'googleapis';
import { logger } from '../utils/logger';

interface OTPUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TelegramCredential {
  id: number;
  user_id: number;
  telegram_chat_id: string;
  telegram_username: string;
  is_verified: boolean;
  linked_at: string;
}

interface OTPRequest {
  id: number;
  user_id: number;
  otp_hash: string;
  expires_at: string;
  used: boolean;
  context: string;
  created_at: string;
}

interface RecoveryCode {
  id: number;
  user_id: number;
  code_hash: string;
  code_hmac: string;
  used: boolean;
  created_at: string;
}

interface LinkToken {
  id: number;
  user_id: number;
  token_hash: string;
  token_hmac: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Google Sheets OTP Adapter Class
 * Provides database-like operations for OTP authentication using Google Sheets
 */
export class GoogleSheetsOTPAdapter {
  private sheets: any;
  private spreadsheetId: string | undefined;

  // Sheet names matching the database tables
  private readonly USERS_SHEET = 'otp_users';
  private readonly TELEGRAM_CREDS_SHEET = 'telegram_credentials';
  private readonly OTP_REQUESTS_SHEET = 'otp_requests';
  private readonly RECOVERY_CODES_SHEET = 'recovery_codes';
  private readonly LINK_TOKENS_SHEET = 'link_tokens';

  constructor(auth: any, spreadsheetId?: string) {
    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Initialize OTP sheets with proper headers
   */
  async initializeSheets(spreadsheetId: string): Promise<void> {
    this.spreadsheetId = spreadsheetId;

    try {
      // Check if sheets already exist
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = response.data.sheets?.map((sheet: any) => sheet.properties.title) || [];

      // Define sheet configurations
      const sheetsToCreate = [
        {
          name: this.USERS_SHEET,
          headers: ['id', 'email', 'username', 'password_hash', 'is_active', 'created_at', 'updated_at'],
        },
        {
          name: this.TELEGRAM_CREDS_SHEET,
          headers: ['id', 'user_id', 'telegram_chat_id', 'telegram_username', 'is_verified', 'linked_at'],
        },
        {
          name: this.OTP_REQUESTS_SHEET,
          headers: ['id', 'user_id', 'otp_hash', 'expires_at', 'used', 'context', 'created_at'],
        },
        {
          name: this.RECOVERY_CODES_SHEET,
          headers: ['id', 'user_id', 'code_hash', 'code_hmac', 'used', 'created_at'],
        },
        {
          name: this.LINK_TOKENS_SHEET,
          headers: ['id', 'user_id', 'token_hash', 'token_hmac', 'expires_at', 'used', 'created_at'],
        },
      ];

      // Create missing sheets
      for (const sheetConfig of sheetsToCreate) {
        if (!existingSheets.includes(sheetConfig.name)) {
          await this.createSheet(sheetConfig.name, sheetConfig.headers);
          logger.info(`✅ Created sheet: ${sheetConfig.name}`);
        } else {
          logger.info(`Sheet already exists: ${sheetConfig.name}`);
        }
      }

      logger.info('✅ OTP sheets initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OTP sheets:', error);
      throw error;
    }
  }

  /**
   * Create a new sheet with headers
   */
  private async createSheet(sheetName: string, headers: string[]): Promise<void> {
    try {
      // Add sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      // Format headers (bold)
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: await this.getSheetId(sheetName),
                  startRowIndex: 0,
                  endRowIndex: 1,
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
          ],
        },
      });
    } catch (error) {
      logger.error(`Failed to create sheet ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get sheet ID by name
   */
  private async getSheetId(sheetName: string): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const sheet = response.data.sheets?.find((s: any) => s.properties.title === sheetName);
    return sheet?.properties.sheetId || 0;
  }

  /**
   * Get next available ID for a sheet
   */
  private async getNextId(sheetName: string): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      const values = response.data.values || [];
      if (values.length <= 1) return 1; // Only headers or empty

      const ids = values.slice(1).map((row: any[]) => parseInt(row[0] || '0', 10));
      return Math.max(...ids, 0) + 1;
    } catch (error) {
      logger.error(`Failed to get next ID for ${sheetName}:`, error);
      return 1;
    }
  }

  /**
   * Users Table Operations
   */
  async createUser(data: Omit<OTPUser, 'id' | 'created_at' | 'updated_at'>): Promise<OTPUser> {
    const id = await this.getNextId(this.USERS_SHEET);
    const now = new Date().toISOString();

    const user: OTPUser = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.USERS_SHEET}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [user.id, user.email, user.username, user.password_hash, user.is_active, user.created_at, user.updated_at],
        ],
      },
    });

    return user;
  }

  async findUserByEmail(email: string): Promise<OTPUser | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.USERS_SHEET}!A:G`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return null;

      const userRow = rows.slice(1).find((row: any[]) => row[1] === email);
      if (!userRow) return null;

      return {
        id: parseInt(userRow[0], 10),
        email: userRow[1],
        username: userRow[2],
        password_hash: userRow[3],
        is_active: userRow[4] === 'TRUE' || userRow[4] === true,
        created_at: userRow[5],
        updated_at: userRow[6],
      };
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      return null;
    }
  }

  async findUserById(id: number): Promise<OTPUser | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.USERS_SHEET}!A:G`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return null;

      const userRow = rows.slice(1).find((row: any[]) => parseInt(row[0], 10) === id);
      if (!userRow) return null;

      return {
        id: parseInt(userRow[0], 10),
        email: userRow[1],
        username: userRow[2],
        password_hash: userRow[3],
        is_active: userRow[4] === 'TRUE' || userRow[4] === true,
        created_at: userRow[5],
        updated_at: userRow[6],
      };
    } catch (error) {
      logger.error('Failed to find user by ID:', error);
      return null;
    }
  }

  /**
   * Telegram Credentials Operations
   */
  async createTelegramCredential(data: Omit<TelegramCredential, 'id' | 'linked_at'>): Promise<TelegramCredential> {
    const id = await this.getNextId(this.TELEGRAM_CREDS_SHEET);
    const now = new Date().toISOString();

    const credential: TelegramCredential = {
      id,
      ...data,
      linked_at: now,
    };

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.TELEGRAM_CREDS_SHEET}!A:F`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            credential.id,
            credential.user_id,
            credential.telegram_chat_id,
            credential.telegram_username,
            credential.is_verified,
            credential.linked_at,
          ],
        ],
      },
    });

    return credential;
  }

  async findTelegramCredentialByUserId(userId: number): Promise<TelegramCredential | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.TELEGRAM_CREDS_SHEET}!A:F`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return null;

      const credRow = rows.slice(1).find((row: any[]) => parseInt(row[1], 10) === userId);
      if (!credRow) return null;

      return {
        id: parseInt(credRow[0], 10),
        user_id: parseInt(credRow[1], 10),
        telegram_chat_id: credRow[2],
        telegram_username: credRow[3],
        is_verified: credRow[4] === 'TRUE' || credRow[4] === true,
        linked_at: credRow[5],
      };
    } catch (error) {
      logger.error('Failed to find Telegram credential:', error);
      return null;
    }
  }

  /**
   * OTP Requests Operations
   */
  async createOTPRequest(data: Omit<OTPRequest, 'id' | 'created_at'>): Promise<OTPRequest> {
    const id = await this.getNextId(this.OTP_REQUESTS_SHEET);
    const now = new Date().toISOString();

    const otpRequest: OTPRequest = {
      id,
      ...data,
      created_at: now,
    };

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${this.OTP_REQUESTS_SHEET}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            otpRequest.id,
            otpRequest.user_id,
            otpRequest.otp_hash,
            otpRequest.expires_at,
            otpRequest.used,
            otpRequest.context,
            otpRequest.created_at,
          ],
        ],
      },
    });

    return otpRequest;
  }

  async findValidOTPRequest(userId: number, context: string): Promise<OTPRequest | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OTP_REQUESTS_SHEET}!A:G`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return null;

      const now = new Date();
      const validRequests = rows
        .slice(1)
        .filter((row: any[]) => {
          const rowUserId = parseInt(row[1], 10);
          const rowContext = row[5];
          const expiresAt = new Date(row[3]);
          const used = row[4] === 'TRUE' || row[4] === true;

          return rowUserId === userId && rowContext === context && expiresAt > now && !used;
        })
        .sort((a: any[], b: any[]) => new Date(b[6]).getTime() - new Date(a[6]).getTime()); // Sort by created_at desc

      if (validRequests.length === 0) return null;

      const row = validRequests[0];
      return {
        id: parseInt(row[0], 10),
        user_id: parseInt(row[1], 10),
        otp_hash: row[2],
        expires_at: row[3],
        used: row[4] === 'TRUE' || row[4] === true,
        context: row[5],
        created_at: row[6],
      };
    } catch (error) {
      logger.error('Failed to find valid OTP request:', error);
      return null;
    }
  }

  async markOTPRequestAsUsed(id: number): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OTP_REQUESTS_SHEET}!A:G`,
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex((row: any[]) => parseInt(row[0], 10) === id);

      if (rowIndex > 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.OTP_REQUESTS_SHEET}!E${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[true]],
          },
        });
      }
    } catch (error) {
      logger.error('Failed to mark OTP request as used:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired OTP requests
   */
  async cleanupExpiredOTPRequests(): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.OTP_REQUESTS_SHEET}!A:G`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return 0;

      const now = new Date();
      let deletedCount = 0;

      // Find expired rows (from bottom to top to maintain indices)
      for (let i = rows.length - 1; i > 0; i--) {
        const expiresAt = new Date(rows[i][3]);
        if (expiresAt < now) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: await this.getSheetId(this.OTP_REQUESTS_SHEET),
                      dimension: 'ROWS',
                      startIndex: i,
                      endIndex: i + 1,
                    },
                  },
                },
              ],
            },
          });
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired OTP requests:', error);
      return 0;
    }
  }
}

export default GoogleSheetsOTPAdapter;
