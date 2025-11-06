import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { TelegramConnectionStore } from '../../utils/TelegramConnectionStore';
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
} from '../../types/telegram';

export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const update: TelegramUpdate = req.body;

    logger.info('Received Telegram webhook update:', {
      updateId: update.update_id,
      messageType: update.message
        ? 'message'
        : update.callback_query
          ? 'callback'
          : 'other',
      chatId:
        update.message?.chat?.id || update.callback_query?.message?.chat?.id,
    });

    // Handle incoming message
    if (update.message) {
      await handleMessage(update.message);
    }

    // Handle callback queries (inline button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
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

async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text;
  const username = message.from.username;

  // Handle /start command
  if (text && text.startsWith('/start')) {
    const startParam = text.split(' ')[1]; // Get parameter after /start

    logger.info('🔍 Processing /start command:', {
      fullText: text,
      startParam: startParam,
      chatId: chatId,
      username: username,
    });

    if (startParam && startParam.startsWith('connect_')) {
      // Extract email from parameter
      const emailEncoded = startParam.replace('connect_', '');
      const email = emailEncoded.replace(/_at_/g, '@').replace(/_dot_/g, '.');

      logger.info('🔍 Email decoding process:', {
        originalParam: startParam,
        emailEncoded: emailEncoded,
        decodedEmail: email,
      });

      try {
        // Store the connection info
        await linkTelegramToUser(email, username || '', chatId.toString());

        // Send enhanced success message with clear next steps
        await sendTelegramMessage(
          chatId,
          `🎉 *Connection Successful!*\n\n` +
            `Your Telegram account has been linked to:\n` +
            `📧 Email: \`${email}\`\n` +
            `👤 Telegram: @${username || 'Unknown'}\n` +
            `🆔 Chat ID: \`${chatId}\`\n\n` +
            `✅ *What's enabled:*\n` +
            `• Budget alerts and notifications\n` +
            `• Spending summaries\n` +
            `• Goal progress updates\n` +
            `• Quick expense logging\n\n` +
            `🔗 Return to your Budget Manager app to see the connection status updated.`
        );

        // Add connection confirmation endpoint call
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Send return link with inline keyboard after a short delay
        setTimeout(async () => {
          await sendTelegramMessageWithButton(
            chatId,
            `📱 Ready to return to your Budget Manager app?\n\n` +
              `Your connection is now active! Click the button below to return to your app and see the updated status.`,
            {
              text: '🔗 Return to Budget Manager',
              url: `${frontendUrl}/settings?telegram_connected=true&chat_id=${chatId}&username=${encodeURIComponent(username || 'Unknown')}`,
            }
          );
        }, 2000);
      } catch (error) {
        logger.error('Error linking Telegram account:', error);
        await sendTelegramMessage(
          chatId,
          `❌ *Connection Failed*\n\n` +
            `Sorry, there was an error linking your account.\n\n` +
            `Please try again by:\n` +
            `1. Going to your Budget Manager Settings\n` +
            `2. Clicking "Connect to Telegram" again\n` +
            `3. Making sure you click "Start" when the bot opens\n\n` +
            `If the problem persists, contact support.`
        );
      }
    } else {
      // Regular /start command
      await sendTelegramMessage(
        chatId,
        `👋 Welcome to Budget Manager Bot!\n\n` +
          `To connect your account, please use the "Connect" button in your Budget Manager app settings.`
      );
    }
  }

  // Handle other commands
  else if (text === '/help') {
    await sendTelegramMessage(
      chatId,
      `📱 Budget Manager Bot Commands:\n\n` +
        `/start - Start the bot\n` +
        `/help - Show this help message\n` +
        `/status - Check your connection status\n\n` +
        `To link your account, use the Connect button in your app settings.`
    );
  } else if (text === '/status') {
    // Check if user is connected
    const isConnected = await checkUserConnection(chatId.toString());
    if (isConnected) {
      await sendTelegramMessage(
        chatId,
        `✅ Your Telegram account is connected to Budget Manager!\n\n` +
          `You'll receive notifications for budget alerts and goal updates.`
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `❌ Your Telegram account is not connected.\n\n` +
          `Please use the Connect button in your Budget Manager app settings to link your account.`
      );
    }
  }
}

async function handleCallbackQuery(
  callbackQuery: TelegramCallbackQuery
): Promise<void> {
  // Handle inline button presses if needed
  logger.info('Received callback query:', callbackQuery);
}

async function linkTelegramToUser(
  email: string,
  username: string,
  chatId: string
): Promise<void> {
  try {
    // Store the connection in our temporary store
    TelegramConnectionStore.storeConnection(email, username, chatId);

    // Also save to Google Sheets for persistence
    try {
      const sheetsService = new GoogleSheetsService();

      // Update user in Google Sheets with Telegram info
      await sheetsService.updateUserTelegramInfo(email, username, chatId);
      logger.info('✅ Telegram connection saved to Google Sheets', {
        email,
        telegram_username: username,
        telegram_chat_id: chatId,
      });
    } catch (sheetsError) {
      logger.error(
        '❌ Failed to save to Google Sheets (but connection stored locally):',
        sheetsError
      );
      // Don't throw error - connection is still valid in memory
    }

    // Log the successful connection
    logger.info('Telegram connection established:', {
      email,
      telegram_username: username,
      telegram_chat_id: chatId,
      connected_at: new Date().toISOString(),
      status: 'connected',
    });

    logger.info(
      `Telegram connection request: ${username} (${chatId}) successfully linked to ${email}`
    );
  } catch (error) {
    logger.error('Error storing Telegram connection:', error);
    throw error;
  }
}

async function checkUserConnection(chatId: string): Promise<boolean> {
  try {
    // Check if user with this chatId exists in our connection store
    const isConnected = TelegramConnectionStore.isUserConnected(chatId);

    logger.info(
      `Connection status for chatId ${chatId}: ${isConnected ? 'CONNECTED' : 'NOT CONNECTED'}`
    );

    return isConnected;
  } catch (error) {
    logger.error('Error checking user connection:', error);
    return false;
  }
}

async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    logger.error('Telegram bot token not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send Telegram message:', error);
    } else {
      logger.info(`Telegram message sent to ${chatId}`);
    }
  } catch (error) {
    logger.error('Error sending Telegram message:', error);
  }
}

async function sendTelegramMessageWithButton(
  chatId: number | string,
  text: string,
  button: { text: string; url: string }
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    logger.error('Telegram bot token not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[button]],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send Telegram message with button:', error);
    } else {
      logger.info(`Telegram message with button sent to ${chatId}`);
    }
  } catch (error) {
    logger.error('Error sending Telegram message:', error);
  }
}
