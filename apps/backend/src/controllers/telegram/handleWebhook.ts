import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { upsertTelegramConnectionByEmail } from './connectionStore';
import { getBotToken } from './types';

// Telegram Bot API update shapes — only the fields this handler reads.
interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

interface TelegramChat {
  id: number;
}

interface TelegramInboundMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramInboundMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramInboundMessage;
  callback_query?: TelegramCallbackQuery;
}

/**
 * POST /api/v1/telegram/webhook — public, no JWT (Telegram's webhook
 * carries no auth token of ours).
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const update = req.body as TelegramUpdate;

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

    if (update.message) {
      await handleMessage(update.message);
    }

    if (update.callback_query) {
      logger.info('Received callback query:', update.callback_query);
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

async function handleMessage(message: TelegramInboundMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text;
  const username = message.from.username;

  if (text && text.startsWith('/start')) {
    const startParam = text.split(' ')[1]; // parameter after /start

    logger.info('Processing /start command:', {
      fullText: text,
      startParam,
      chatId,
      username,
    });

    if (startParam && startParam.startsWith('connect_')) {
      // Deep-link email encoding scheme (ported verbatim from
      // backend-v1's handleWebhook.ts): the app builds the link as
      // `/start connect_<email with '@' -> '_at_' and '.' -> '_dot_'>`,
      // so decoding is the exact inverse of those two replacements.
      const emailEncoded = startParam.replace('connect_', '');
      const email = emailEncoded.replace(/_at_/g, '@').replace(/_dot_/g, '.');

      logger.info('Email decoding process:', {
        originalParam: startParam,
        emailEncoded,
        decodedEmail: email,
      });

      try {
        const result = await upsertTelegramConnectionByEmail(email, {
          chatId: chatId.toString(),
          telegramUsername: username,
          status: 'connected',
        });

        if (!result) {
          await sendTelegramMessage(
            chatId,
            `❌ *Connection Failed*\n\n` +
              `No Budget Manager account was found for \`${email}\`.\n\n` +
              `Please make sure you're using the Connect link from your ` +
              `Budget Manager app settings.`
          );
          return;
        }

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

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        setTimeout(() => {
          sendTelegramMessageWithButton(
            chatId,
            `📱 Ready to return to your Budget Manager app?\n\n` +
              `Your connection is now active! Click the button below to ` +
              `return to your app and see the updated status.`,
            {
              text: '🔗 Return to Budget Manager',
              url: `${frontendUrl}/settings?telegram_connected=true&chat_id=${chatId}&username=${encodeURIComponent(username || 'Unknown')}`,
            }
          ).catch((error) =>
            logger.error('Error sending follow-up Telegram message:', error)
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
      await sendTelegramMessage(
        chatId,
        `👋 Welcome to Budget Manager Bot!\n\n` +
          `To connect your account, please use the "Connect" button in ` +
          `your Budget Manager app settings.`
      );
    }
  } else if (text === '/help') {
    await sendTelegramMessage(
      chatId,
      `📱 Budget Manager Bot Commands:\n\n` +
        `/start - Start the bot\n` +
        `/help - Show this help message\n` +
        `/status - Check your connection status\n\n` +
        `To link your account, use the Connect button in your app settings.`
    );
  } else if (text === '/status') {
    // Unlike backend-v1's in-memory TelegramConnectionStore (a single
    // process-wide Map keyed by both email *and* chat_id, so a chat_id ->
    // connection lookup was free), connections now live inside each
    // user's own per-user sheet, keyed by their email. There is no
    // reverse chat_id -> email index anywhere (and building one would mean
    // scanning every user's sheet on every /status message), so this bot
    // can no longer answer "am I connected?" from the chat_id alone.
    // Point the user at the app instead of guessing.
    await sendTelegramMessage(
      chatId,
      `ℹ️ Please check your connection status in the Budget Manager app ` +
        `under Settings — this bot can't look up your account from a chat ` +
        `message alone.`
    );
  }
}

async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<void> {
  const botToken = getBotToken();

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
          text,
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
  const botToken = getBotToken();

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
          text,
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
    logger.error('Error sending Telegram message with button:', error);
  }
}
