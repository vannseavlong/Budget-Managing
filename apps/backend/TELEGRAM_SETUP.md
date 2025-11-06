# 🤖 Telegram Bot Setup Guide

This guide will help you configure your Telegram bot (@MMMSSEavlONGBoT) to work with your Budget Manager application.

## 📋 Prerequisites

1. ✅ Your bot token: `7388924117:AAFcht-1MsFTpixlYsKdN5Tce_KX93UNU5M`
2. ✅ Your bot username: `@MMMSSEavlONGBoT`
3. ✅ Backend server running on: `http://localhost:3001`

## 🚀 Quick Setup

### Step 1: Run the Setup Script

```bash
cd apps/backend
node setup-telegram.js
```

This script will:
- ✅ Configure the webhook URL
- ✅ Set up bot commands (/start, /help, /status)
- ✅ Display bot information

### Step 2: Start Your Servers

```bash
# Start both frontend and backend
turbo dev

# Or start them separately:
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

### Step 3: Test the Integration

1. **Test Basic Bot Function:**
   - Visit: https://t.me/MMMSSEavlONGBoT
   - Send `/start` command
   - You should receive a welcome message

2. **Test Account Linking:**
   - Go to your app Settings page
   - Click "Connect" button next to Telegram
   - This opens: `https://t.me/MMMSSEavlONGBoT?start=connect_your_email`
   - Click "Start" in Telegram
   - Bot should send success message and redirect link

## 🔧 Manual Configuration (if needed)

If the script doesn't work, you can set up manually:

### 1. Set Webhook URL

```bash
curl -X POST "https://api.telegram.org/bot7388924117:AAFcht-1MsFTpixlYsKdN5Tce_KX93UNU5M/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3001/api/v1/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### 2. Set Bot Commands

```bash
curl -X POST "https://api.telegram.org/bot7388924117:AAFcht-1MsFTpixlYsKdN5Tce_KX93UNU5M/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Start the bot and link your account"},
      {"command": "help", "description": "Show help and available commands"},
      {"command": "status", "description": "Check your connection status"}
    ]
  }'
```

## 🔄 How the Integration Works

### 1. User Flow:
```
App Settings → Click "Connect" → Opens Telegram → Click "Start" → Bot processes → Redirects back to app
```

### 2. Technical Flow:
```
Frontend → Telegram Deep Link → Bot Webhook → Database Update → Success Message → Redirect
```

### 3. URL Format:
```
https://t.me/MMMSSEavlONGBoT?start=connect_{encoded_email}
```

Example: `user@example.com` becomes `connect_user_at_example_dot_com`

## 📱 Bot Commands

- `/start` - Welcome message and account linking
- `/start connect_email` - Link specific email account
- `/help` - Show available commands
- `/status` - Check connection status

## 🛠️ Backend Configuration

The webhook handler processes these events:

### Message Events:
- `/start` with connection parameter → Link account
- `/start` without parameter → Welcome message
- `/help` → Show commands
- `/status` → Check connection

### Connection Process:
1. Extract email from start parameter
2. Store telegram username and chat ID
3. Send success message to user
4. Provide redirect link back to app

## 🔗 API Endpoints

- `POST /api/v1/telegram/webhook` - Receives Telegram updates
- `GET /api/v1/telegram/connect-success` - Handles successful connections
- `PUT /api/v1/auth/profile` - Updates user telegram fields

## 🧪 Testing Checklist

- [ ] Bot responds to `/start`
- [ ] Bot responds to `/help`
- [ ] Bot responds to `/status`
- [ ] Connect button opens correct Telegram link
- [ ] Bot processes connection requests
- [ ] Success message appears in Telegram
- [ ] Redirect link works
- [ ] Profile updates with telegram info
- [ ] Refresh button fetches latest data

## 🔍 Troubleshooting

### Bot not responding:
- Check webhook is set correctly
- Verify backend server is running
- Check bot token in environment variables

### Connection not working:
- Verify webhook URL is accessible
- Check database schema has telegram fields
- Ensure profile update API is working

### Redirect not working:
- Check FRONTEND_URL in backend .env
- Verify success redirect endpoint
- Test URL parameter handling

## 🎯 Next Steps

After successful setup:
1. Test all user flows
2. Implement notification sending
3. Add more bot commands
4. Set up production webhook (HTTPS)
5. Add error handling and logging