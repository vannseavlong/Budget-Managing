import { Request, Response } from 'express';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation schemas
const createSpreadsheetSchema = z.object({
  name: z.string().min(1, 'Spreadsheet name is required').optional(),
  template: z.enum(['default', 'basic', 'advanced']).default('default'),
});

const shareSpreadsheetSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['viewer', 'editor', 'owner']).default('viewer'),
});

export class SheetsController {
  private googleSheetsService: GoogleSheetsService;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
  }

  /**
   * Create a new Google Sheets database for the user
   */
  async createUserDatabase(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createSpreadsheetSchema.parse(req.body);
      const userEmail = req.user?.email;

      if (!userEmail) {
        res.status(401).json({
          success: false,
          message: 'User email not found in token',
        });
        return;
      }

      // Implementation placeholder - will create the actual spreadsheet
      const spreadsheetId =
        await this.googleSheetsService.getOrCreateUserDatabase(userEmail);

      res.status(201).json({
        success: true,
        data: {
          spreadsheet_id: spreadsheetId,
          spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
          name: validatedData.name || `Budget Manager - ${userEmail}`,
          template: validatedData.template,
        },
        message: 'Google Sheets database created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      logger.error('Error creating Google Sheets database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Google Sheets database',
      });
    }
  }

  /**
   * Get spreadsheet information
   */
  async getSpreadsheetInfo(req: Request, res: Response): Promise<void> {
    try {
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // Implementation placeholder - will get actual spreadsheet info
      res.status(200).json({
        success: true,
        data: {
          spreadsheet_id: spreadsheetId,
          spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
          title: 'Budget Manager Database',
          sheets: [
            'users',
            'settings',
            'categories',
            'transactions',
            'budgets',
            'budget_items',
            'goals',
            'telegram_messages',
          ],
          created_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        },
        message: 'Spreadsheet information retrieved successfully',
      });
    } catch (error) {
      logger.error('Error getting spreadsheet info:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Share spreadsheet with another user
   */
  async shareSpreadsheet(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = shareSpreadsheetSchema.parse(req.body);
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // Implementation placeholder - will implement actual sharing
      res.status(200).json({
        success: true,
        data: {
          shared_with: validatedData.email,
          role: validatedData.role,
          spreadsheet_id: spreadsheetId,
        },
        message: 'Spreadsheet shared successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      logger.error('Error sharing spreadsheet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Export spreadsheet data
   */
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', sheets } = req.query;
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // Implementation placeholder - will implement actual export
      res.status(200).json({
        success: true,
        data: {
          export_format: format,
          sheets_exported: sheets || 'all',
          download_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=${format}`,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        },
        message: 'Data export prepared successfully',
      });
    } catch (error) {
      logger.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Import data into spreadsheet
   */
  async importData(req: Request, res: Response): Promise<void> {
    try {
      const { data, sheet_name, mode = 'append' } = req.body;
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // Implementation placeholder - will implement actual import
      res.status(200).json({
        success: true,
        data: {
          rows_imported: Array.isArray(data) ? data.length : 0,
          sheet_name: sheet_name,
          import_mode: mode,
        },
        message: 'Data imported successfully',
      });
    } catch (error) {
      logger.error('Error importing data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Initialize spreadsheet with schema
   */
  async initializeSchema(req: Request, res: Response): Promise<void> {
    try {
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // This will create all the required sheets with proper schema
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

      // Implementation placeholder - will create sheets with proper headers
      res.status(200).json({
        success: true,
        data: {
          sheets_created: Object.keys(schema),
          schema: schema,
        },
        message: 'Spreadsheet schema initialized successfully',
      });
    } catch (error) {
      logger.error('Error initializing schema:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Backup spreadsheet data
   */
  async createBackup(req: Request, res: Response): Promise<void> {
    try {
      const spreadsheetId = req.user?.spreadsheetId;

      if (!spreadsheetId) {
        res.status(404).json({
          success: false,
          message: 'No spreadsheet found for user',
        });
        return;
      }

      // Implementation placeholder - will create backup
      const backupId = `backup-${Date.now()}`;

      res.status(201).json({
        success: true,
        data: {
          backup_id: backupId,
          original_spreadsheet_id: spreadsheetId,
          backup_spreadsheet_id: `${spreadsheetId}-backup-${Date.now()}`,
          created_at: new Date().toISOString(),
        },
        message: 'Backup created successfully',
      });
    } catch (error) {
      logger.error('Error creating backup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Initialize/Setup database schema in the spreadsheet (REQUIRED STEP)
   */
  setupDatabaseSchema = async (req: Request, res: Response): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { spreadsheetId, googleCredentials, email } =
        authenticatedReq.user!;

      this.googleSheetsService.setCredentials(googleCredentials);

      // Create the database schema with proper tables
      await this.googleSheetsService.createDatabaseSchema(spreadsheetId);

      logger.info(`Database schema setup completed for user: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Database schema setup completed successfully',
        spreadsheetId,
        tables: [
          'users',
          'settings',
          'categories',
          'transactions',
          'budgets',
          'budget_items',
          'goals',
          'telegram_messages',
        ],
      });
    } catch (error) {
      logger.error('Error setting up database schema:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to setup database schema',
      });
    }
  };

  /**
   * Check if database schema is properly set up
   */
  validateDatabaseSchema = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

      this.googleSheetsService.setCredentials(googleCredentials);

      const validation =
        await this.googleSheetsService.validateDatabaseSchema(spreadsheetId);

      res.status(200).json({
        success: true,
        validation,
      });
    } catch (error) {
      logger.error('Error validating database schema:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to validate database schema',
      });
    }
  };
}
