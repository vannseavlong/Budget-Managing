// Load environment variables from .env file
require('dotenv').config();

const ngrok = require('@ngrok/ngrok');
const https = require('https');

// Configuration
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  '7388924117:AAFcht-1MsFTpixlYsKdN5Tce_KX93UNU5M';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'MMMSSEavlONGBoT';
const PORT = process.env.PORT || 3001;

async function setupTelegramWithNgrok() {
  try {
    console.log('🔗 Starting ngrok tunnel...');

    // Create ngrok tunnel
    const listener = await ngrok.connect({
      addr: PORT,
      authtoken_from_env: true,
    });

    const tunnelUrl = listener.url();
    console.log(`✅ Ngrok tunnel established at: ${tunnelUrl}`);

    // Set up webhook with the tunnel URL
    const webhookUrl = `${tunnelUrl}/api/v1/telegram/webhook`;
    console.log(`📡 Setting webhook to: ${webhookUrl}`);

    await setupWebhook(webhookUrl);
    await setupCommands();

    console.log('\n🎉 Telegram Bot Setup Complete!');
    console.log(
      `📱 Your bot is now accessible at: https://t.me/${BOT_USERNAME}`
    );
    console.log(`🔗 Webhook URL: ${webhookUrl}`);
    console.log('\n⚠️  Keep this script running to maintain the tunnel!');
    console.log('Press Ctrl+C to stop the tunnel and webhook');

    // Keep the script running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping ngrok tunnel...');
      await ngrok.disconnect();
      process.exit(0);
    });

    // Keep the process alive indefinitely
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
    }
  } catch (error) {
    console.error('❌ Error setting up ngrok tunnel:', error.message);
    process.exit(1);
  }
}

async function setupWebhook(webhookUrl) {
  const webhookData = JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(webhookData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('✅ Webhook set successfully!');
          resolve(response);
        } else {
          console.error('❌ Failed to set webhook:', response.description);
          reject(new Error(response.description));
        }
      });
    });

    req.on('error', reject);
    req.write(webhookData);
    req.end();
  });
}

async function setupCommands() {
  const commands = [
    { command: 'start', description: 'Start the bot and link your account' },
    { command: 'help', description: 'Show help and available commands' },
    { command: 'status', description: 'Check your connection status' },
  ];

  const commandData = JSON.stringify({ commands });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setMyCommands`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(commandData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('✅ Bot commands set successfully!');
          resolve(response);
        } else {
          console.error('❌ Failed to set commands:', response.description);
          reject(new Error(response.description));
        }
      });
    });

    req.on('error', reject);
    req.write(commandData);
    req.end();
  });
}

// Run the setup
if (require.main === module) {
  if (!process.env.NGROK_AUTHTOKEN) {
    console.error(
      '❌ ERROR: NGROK_AUTHTOKEN environment variable is required!'
    );
    console.log('\n📋 To fix this:');
    console.log('1. Sign up for ngrok: https://ngrok.com/');
    console.log('2. Get your authtoken from the dashboard');
    console.log(
      '3. Set the environment variable: NGROK_AUTHTOKEN=your_token_here'
    );
    console.log('4. Run this script again\n');
    process.exit(1);
  }

  setupTelegramWithNgrok();
}

module.exports = { setupTelegramWithNgrok };
