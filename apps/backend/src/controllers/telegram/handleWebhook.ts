import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
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

    if (startParam && startParam.startsWith('connect_')) {
      // Extract email from parameter
      const emailEncoded = startParam.replace('connect_', '');
      const email = emailEncoded.replace('_at_', '@').replace('_dot_', '.');

      try {
        // Store the connection info (we'll implement the actual linking later)
        await linkTelegramToUser(email, username || '', chatId.toString());

        // Send success message to user
        await sendTelegramMessage(
          chatId,
          `🎉 Success! Your Telegram account (@${username || 'Unknown'}) has been linked to your Budget Manager account (${email}).\n\n` +
            `You can now:\n` +
            `• Receive budget alerts\n` +
            `• Get spending notifications\n` +
            `• View goal progress updates\n\n` +
            `You will be redirected back to the app shortly.`
        );

        // Redirect user back to app after 3 seconds
        setTimeout(async () => {
          const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:3000';
          await sendTelegramMessage(
            chatId,
            `🔗 [Click here to return to your Budget Manager](${frontendUrl}/settings?telegram_connected=true&username=${encodeURIComponent(username || 'Unknown')})`
          );
        }, 3000);
      } catch (error) {
        logger.error('Error linking Telegram account:', error);
        await sendTelegramMessage(
          chatId,
          `❌ Sorry, there was an error linking your account. Please try again or contact support.`
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
  // For now, we'll log the connection attempt
  // In a real implementation, you'd store this in a temporary table
  // and then let the user's profile update when they refresh
  logger.info(
    `Telegram connection request: ${username} (${chatId}) wants to link to ${email}`
  );

  // TODO: Store in temporary connections table or implement direct database update
  // The current approach will require the user to refresh their profile manually
}

async function checkUserConnection(chatId: string): Promise<boolean> {
  // Check if user with this chatId exists in our database
  // TODO: Implement connection check by querying Google Sheets
  logger.info(`Checking connection status for chatId: ${chatId}`);
  return false; // Always return false for now
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
