import { Request, Response } from 'express';
import {
  GoogleSheetsService,
  DatabaseRecord,
} from '../services/GoogleSheetsService';
import { TelegramConnectionStore } from '../utils/TelegramConnectionStore';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const sendTelegramMessageSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID is required'),
  payload: z.object({
    type: z.enum([
      'budget_alert',
      'goal_alert',
      'transaction_reminder',
      'custom',
    ]),
    message: z.string().min(1, 'Message is required'),
    data: z.record(z.any()).optional(),
  }),
});

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message: TelegramMessage;
  data: string;
}

interface TelegramMessageOptions {
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        callback_data?: string;
        url?: string;
      }>
    >;
  };
  parse_mode?: string;
}

export class TelegramController {
  private googleSheetsService: GoogleSheetsService;
  private botToken: string;
  private botUrl: string;
  private frontendUrl: string;

  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.botUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send message to Telegram API
   */
  private async sendTelegramMessage(
    chatId: string,
    text: string,
    options: TelegramMessageOptions = {}
  ): Promise<unknown> {
    try {
      const response = await fetch(`${this.botUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  /**
   * Answer callback query
   */
  private async answerCallbackQuery(
    callbackQueryId: string,
    text?: string
  ): Promise<void> {
    try {
      await fetch(`${this.botUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || 'Action completed!',
        }),
      });
    } catch (error) {
      logger.error('Error answering callback query:', error);
    }
  }
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, per_page = 50, status } = req.query;

      // Implementation placeholder - will be implemented with Google Sheets integration
      res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: Number(page),
          per_page: Number(per_page),
          total: 0,
          total_pages: 0,
        },
        message: 'Telegram messages retrieved successfully',
      });
    } catch (error) {
      logger.error('Error getting Telegram messages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Send a Telegram message
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = sendTelegramMessageSchema.parse(req.body);

      // Implementation placeholder - will be implemented with Telegram Bot API integration
      res.status(201).json({
        success: true,
        data: {
          id: 'placeholder',
          ...validatedData,
          status: 'pending',
          sent_at: null,
        },
        message: 'Telegram message queued successfully',
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

      logger.error('Error sending Telegram message:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Configure Telegram webhook
   */
  async configureWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhook_url, bot_token } = req.body;

      // Implementation placeholder - will be implemented with Telegram Bot API integration
      res.status(200).json({
        success: true,
        message: 'Telegram webhook configured successfully',
      });
    } catch (error) {
      logger.error('Error configuring Telegram webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Handle Telegram webhook updates
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const update: TelegramUpdate = req.body;
      logger.info('Received Telegram webhook update:', update);

      // Handle text messages (including /start command)
      if (update.message) {
        await this.handleMessage(update.message);
      }

      // Handle callback queries (button clicks)
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling Telegram webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Handle incoming text messages
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id.toString();
    const text = message.text || '';
    const user = message.from;

    logger.info(`Message from ${user.first_name} (${user.id}): ${text}`);

    if (text.startsWith('/start')) {
      await this.handleStartCommand(chatId, user, text);
    } else {
      await this.handleRegularMessage(chatId, user, text);
    }
  }

  /**
   * Handle /start command
   */
  private async handleStartCommand(
    chatId: string,
    user: TelegramUser,
    text: string
  ): Promise<void> {
    const startParam = text.split(' ')[1]; // Extract parameter after /start

    if (startParam === 'connect_budget_app') {
      await this.handleBudgetConnection(chatId, user);
    } else {
      await this.sendWelcomeMessage(chatId, user);
    }
  }

  /**
   * Handle budget app connection flow
   */
  private async handleBudgetConnection(
    chatId: string,
    user: TelegramUser
  ): Promise<void> {
    const welcomeText = `🎉 <b>Welcome to MMMS Budget Manager!</b>

Hi ${user.first_name}! I'm here to help you manage your finances and stay on top of your budget goals.

<b>What I can do for you:</b>
📊 Send daily/weekly budget summaries
🚨 Alert you about overspending
💰 Track your expense goals
📝 Log expenses via chat
📈 Provide spending insights

<b>Let's get you connected!</b>`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔗 Connect to Budget App',
            callback_data: `connect_app_${user.id}`,
          },
        ],
        [
          {
            text: '📱 Open Budget Manager',
            url: this.frontendUrl,
          },
        ],
        [
          {
            text: '❓ Help & Features',
            callback_data: 'show_help',
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, welcomeText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Handle regular messages (non-commands)
   */
  private async handleRegularMessage(
    chatId: string,
    user: any,
    text: string
  ): Promise<void> {
    // Quick expense logging feature
    if (text.match(/^\d+(\.\d{2})?$/)) {
      const amount = parseFloat(text);
      await this.handleQuickExpense(chatId, user, amount);
    } else {
      await this.sendHelpMessage(chatId);
    }
  }

  /**
   * Handle callback queries (button clicks)
   */
  private async handleCallbackQuery(
    callbackQuery: TelegramCallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message.chat.id.toString();
    const user = callbackQuery.from;
    const data = callbackQuery.data;

    if (data.startsWith('connect_app_')) {
      await this.processUserConnection(chatId, user);
      await this.answerCallbackQuery(callbackQuery.id, 'Connection processed!');
    } else if (data === 'show_help') {
      await this.sendDetailedHelp(chatId);
      await this.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('quick_expense_')) {
      const amount = parseFloat(data.split('_')[2]);
      await this.confirmQuickExpense(chatId, user, amount);
      await this.answerCallbackQuery(callbackQuery.id, 'Expense logged!');
    }
  }

  /**
   * Process user connection to budget app
   */
  private async processUserConnection(
    chatId: string,
    user: any
  ): Promise<void> {
    // Store user connection data (you can implement Google Sheets storage here)
    const connectionData = {
      chatId,
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      connectedAt: new Date().toISOString(),
    };

    logger.info('User connection processed:', connectionData);

    const successText = `✅ <b>Successfully Connected!</b>

Your Telegram account is now linked to your Budget Manager app.

<b>Chat ID:</b> <code>${chatId}</code>
<b>User:</b> ${user.first_name} ${user.last_name ? user.last_name : ''}${user.username ? ` (@${user.username})` : ''}

<b>What's next?</b>
• You'll receive budget notifications here
• Send me amounts like "25.50" to log expenses
• Use the buttons below for quick actions`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📱 Return to Budget App',
            url: `${this.frontendUrl}/settings?telegram_connected=true`,
          },
        ],
        [
          {
            text: '💰 Log Expense',
            callback_data: 'log_expense',
          },
          {
            text: '📊 View Summary',
            callback_data: 'view_summary',
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, successText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Send welcome message for general /start
   */
  private async sendWelcomeMessage(chatId: string, user: any): Promise<void> {
    const welcomeText = `👋 <b>Hello ${user.first_name}!</b>

Welcome to the MMMS Budget Management Bot!

I can help you:
• Track your expenses and income
• Set and monitor budget goals  
• Get spending alerts and summaries
• Log expenses quickly via chat

<b>To get started:</b>
Visit my Monthly Money Management Web: 
${this.frontendUrl}

To use my MMMS Web, you need to know your telegram Chat ID.
Use this bot to get Your ID: @WhatChatIDBot`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🌐 Visit Budget Manager',
            url: this.frontendUrl,
          },
        ],
        [
          {
            text: '🆔 Get Chat ID',
            url: 'https://t.me/WhatChatIDBot',
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, welcomeText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Handle quick expense logging
   */
  private async handleQuickExpense(
    chatId: string,
    user: any,
    amount: number
  ): Promise<void> {
    const expenseText = `💰 <b>Quick Expense Entry</b>

Amount: <b>$${amount.toFixed(2)}</b>
From: ${user.first_name}

Would you like to log this expense?`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✅ Yes, Log It',
            callback_data: `quick_expense_${amount}`,
          },
          {
            text: '❌ Cancel',
            callback_data: 'cancel_expense',
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, expenseText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Send help message
   */
  private async sendHelpMessage(chatId: string): Promise<void> {
    const helpText = `❓ <b>How to use this bot:</b>

<b>Commands:</b>
• Send any amount (e.g., "25.50") to log an expense
• /start - Show welcome message

<b>Quick Actions:</b>
• Use the buttons below for common tasks

<b>Need more help?</b>
Visit your Budget Manager app for full features!`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📱 Open Budget App',
            url: this.frontendUrl,
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, helpText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Send detailed help information
   */
  private async sendDetailedHelp(chatId: string): Promise<void> {
    const helpText = `📖 <b>MMMS Budget Manager Features</b>

<b>🏦 Budget Tracking:</b>
• Set monthly/weekly budgets
• Track spending across categories
• Get alerts when approaching limits

<b>💰 Expense Management:</b>
• Log expenses via app or chat
• Categorize transactions
• Add notes and receipts

<b>📊 Reports & Analytics:</b>
• View spending summaries
• Track goal progress
• Export data to spreadsheets

<b>🔔 Notifications:</b>
• Budget alerts
• Goal reminders
• Weekly summaries

<b>Quick Chat Commands:</b>
• Send amounts like "25.50" to log expenses
• Use buttons for quick actions

Ready to start managing your finances better?`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Get Started',
            url: this.frontendUrl,
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, helpText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Confirm quick expense entry
   */
  private async confirmQuickExpense(
    chatId: string,
    user: any,
    amount: number
  ): Promise<void> {
    const confirmText = `✅ <b>Expense Logged Successfully!</b>

Amount: <b>$${amount.toFixed(2)}</b>
Date: ${new Date().toLocaleDateString()}
User: ${user.first_name}

Your expense has been recorded. Check your Budget Manager app for details.`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📱 View in App',
            url: `${this.frontendUrl}/tracker`,
          },
        ],
      ],
    };

    await this.sendTelegramMessage(chatId, confirmText, {
      reply_markup: keyboard,
    });
  }

  /**
   * Handle Telegram connection from frontend
   */
  async connectTelegram(req: Request, res: Response): Promise<void> {
    try {
      const { telegram_data } = req.body;

      if (!telegram_data) {
        res.status(400).json({
          success: false,
          message: 'Telegram data is required',
        });
        return;
      }

      // Here you would store the connection in your database/Google Sheets
      // For now, we'll simulate a successful connection
      logger.info('Processing Telegram connection:', telegram_data);

      res.status(200).json({
        success: true,
        data: {
          chat_id: telegram_data.id,
          username: telegram_data.username,
          first_name: telegram_data.first_name,
          connected_at: new Date().toISOString(),
        },
        message: 'Telegram connection processed successfully',
      });
    } catch (error) {
      logger.error('Error processing Telegram connection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get Telegram connection status for user
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      // Get user email from the authenticated request
      const userEmail = (req as any).user?.email;

      logger.info('🔍 Getting connection status for user:', { userEmail });

      if (!userEmail) {
        logger.warn('❌ User not authenticated - no email found');
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Debug: List all connections in store
      const allConnections = TelegramConnectionStore.getAllConnections();
      logger.info('📊 All connections in store:', allConnections);

      // First check connection status in memory store
      let connection = TelegramConnectionStore.getConnectionByEmail(userEmail);

      // If not in memory, try to load from Google Sheets
      if (!connection) {
        try {
          const sheetsService = new GoogleSheetsService();
          const userSpreadsheetId = await sheetsService.getOrCreateUserDatabase(
            userEmail,
            userEmail.split('@')[0]
          );

          if (userSpreadsheetId) {
            const users = await sheetsService.find(userSpreadsheetId, 'users');
            const userRecord = users.find(
              (user: DatabaseRecord) => user.email === userEmail
            );

            if (
              userRecord &&
              userRecord.telegram_username &&
              userRecord.chatId
            ) {
              // Found connection in Google Sheets, restore to memory
              TelegramConnectionStore.storeConnection(
                userEmail,
                userRecord.telegram_username as string,
                userRecord.chatId as string
              );

              connection = {
                email: userEmail,
                telegram_username: userRecord.telegram_username as string,
                chat_id: userRecord.chatId as string,
                connected_at:
                  (userRecord.updated_at as string) || new Date().toISOString(),
                status: 'connected' as const,
              };

              logger.info('✅ Connection restored from Google Sheets');
            }
          }
        } catch (sheetsError) {
          logger.error('❌ Error loading from Google Sheets:', sheetsError);
          // Continue with memory-only check
        }
      }

      logger.info('🔎 Final connection found for email:', {
        userEmail,
        connection,
      });

      if (connection) {
        logger.info('✅ Connection found, returning success');
        res.status(200).json({
          success: true,
          data: {
            is_connected: true,
            telegram_username: connection.telegram_username,
            chat_id: connection.chat_id,
            connected_at: connection.connected_at,
          },
          message: 'Connection status retrieved successfully',
        });
      } else {
        logger.info('❌ No connection found for user');
        res.status(200).json({
          success: true,
          data: {
            is_connected: false,
            telegram_username: null,
            chat_id: null,
            connected_at: null,
          },
          message: 'No Telegram connection found',
        });
      }
    } catch (error) {
      logger.error('Error getting connection status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Debug endpoint to show all connections and user info
   */
  async debugConnections(req: Request, res: Response): Promise<void> {
    try {
      const userEmail = (req as Request & { user?: { email: string } }).user
        ?.email;
      const allConnections = TelegramConnectionStore.getAllConnections();

      res.status(200).json({
        success: true,
        data: {
          current_user_email: userEmail,
          all_connections: allConnections,
          connection_for_user: TelegramConnectionStore.getConnectionByEmail(
            userEmail || ''
          ),
        },
        message: 'Debug information retrieved successfully',
      });
    } catch (error) {
      logger.error('Error getting debug connections:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Test Telegram bot connection
   */
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      // Implementation placeholder - will be implemented with Telegram Bot API integration
      res.status(200).json({
        success: true,
        data: {
          bot_username: 'budget_manager_bot',
          is_connected: true,
          webhook_configured: false,
        },
        message: 'Telegram connection tested successfully',
      });
    } catch (error) {
      logger.error('Error testing Telegram connection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
