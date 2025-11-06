#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Telegram Bot Setup Script
 *
 * This script configures your Telegram bot with the necessary webhook
 * and commands for the Budget Manager integration.
 */

// Load environment variables from .env file
require('dotenv').config();

const https = require('https');

// Configuration - Load from environment variables only
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

// Validate required environment variables
if (!BOT_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN is required in .env file');
  console.log('\n📋 To fix this:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add: TELEGRAM_BOT_TOKEN=your_bot_token_here');
  console.log('3. Add: TELEGRAM_BOT_USERNAME=your_bot_username');
  console.log('4. Add: TELEGRAM_WEBHOOK_URL=your_ngrok_url');
  process.exit(1);
}

if (!BOT_USERNAME) {
  console.error('❌ ERROR: TELEGRAM_BOT_USERNAME is required in .env file');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ ERROR: TELEGRAM_WEBHOOK_URL is required in .env file');
  console.log(
    '\n📋 Note: Use setup-telegram-ngrok.js for automatic URL generation'
  );
  process.exit(1);
}

console.log('🤖 Setting up Telegram Bot Integration...\n');

// Check if webhook URL is HTTPS
if (!WEBHOOK_URL.startsWith('https://')) {
  console.error('❌ ERROR: Webhook URL must be HTTPS!');
  console.log('\n📋 To fix this for development:');
  console.log('1. Install ngrok: npm install -g ngrok');
  console.log('2. Start your backend: npm run dev');
  console.log('3. In another terminal: ngrok http 3001');
  console.log('4. Copy the HTTPS URL from ngrok');
  console.log(
    '5. Set environment variable: TELEGRAM_WEBHOOK_URL=https://your-url.ngrok-free.app/api/v1/telegram/webhook'
  );
  console.log('6. Run this script again\n');
  process.exit(1);
}

// Step 1: Set up webhook
async function setupWebhook() {
  console.log('📡 Setting up webhook...');

  const webhookData = JSON.stringify({
    url: WEBHOOK_URL,
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

// Step 2: Set up bot commands
async function setupCommands() {
  console.log('⚙️ Setting up bot commands...');

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

// Step 3: Get bot info
async function getBotInfo() {
  console.log('ℹ️ Getting bot information...');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getMe`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          const bot = response.result;
          console.log(`✅ Bot Info:
  Name: ${bot.first_name}
  Username: @${bot.username}
  ID: ${bot.id}
  Can Join Groups: ${bot.can_join_groups}
  Can Read All Group Messages: ${bot.can_read_all_group_messages}
  Supports Inline Queries: ${bot.supports_inline_queries}`);
          resolve(response);
        } else {
          console.error('❌ Failed to get bot info:', response.description);
          reject(new Error(response.description));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Main setup function
async function main() {
  try {
    await getBotInfo();
    await setupWebhook();
    await setupCommands();

    console.log('\n🎉 Telegram Bot Setup Complete!\n');
    console.log('📱 Next Steps:');
    console.log(`1. Start your backend server: npm run dev`);
    console.log(`2. Test your bot by visiting: https://t.me/${BOT_USERNAME}`);
    console.log(`3. Send /start to test basic functionality`);
    console.log(`4. Use the Connect button in your app to link accounts\n`);

    console.log('🔗 Test URL format:');
    console.log(
      `https://t.me/${BOT_USERNAME}?start=connect_user_at_example_dot_com\n`
    );
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  main();
}

module.exports = { setupWebhook, setupCommands, getBotInfo };
