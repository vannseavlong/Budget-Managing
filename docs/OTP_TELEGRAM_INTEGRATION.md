# OTP Telegram Authentication Integration

## Overview

This document describes the integration of OTP (One-Time Password) authentication using Telegram, adapted to work with Google Sheets as the data store instead of PostgreSQL.

## Architecture

The OTP authentication system consists of the following components:

### 1. **Google Sheets Adapter** (`google-sheets-otp-adapter.ts`)
- Translates database operations to Google Sheets API calls
- Manages 5 sheets (tabs) in your Google Spreadsheet:
  - `otp_users` - User accounts with email/password
  - `telegram_credentials` - Telegram account linkage
  - `otp_requests` - OTP codes and verification
  - `recovery_codes` - Account recovery codes (reserved for future use)
  - `link_tokens` - Telegram linking tokens (reserved for future use)

### 2. **OTP Controllers** (`otp-auth.ts`)
- Handles authentication logic
- Generates and verifies OTP codes
- Sends OTP via Telegram Bot API
- Issues JWT tokens upon successful authentication

### 3. **API Routes** (`routes/otp-auth.ts`)
- RESTful endpoints for authentication operations
- Integrates with existing authentication middleware

## Data Structure

### Sheet: `otp_users`
| Column | Type | Description |
|--------|------|-------------|
| id | number | Auto-increment user ID |
| email | string | User email (unique) |
| username | string | Display name |
| password_hash | string | Bcrypt hashed password |
| is_active | boolean | Account active status |
| created_at | timestamp | Account creation date |
| updated_at | timestamp | Last update date |

### Sheet: `telegram_credentials`
| Column | Type | Description |
|--------|------|-------------|
| id | number | Auto-increment ID |
| user_id | number | Reference to otp_users.id |
| telegram_chat_id | string | Telegram chat ID |
| telegram_username | string | Telegram username |
| is_verified | boolean | Verification status |
| linked_at | timestamp | Link date |

### Sheet: `otp_requests`
| Column | Type | Description |
|--------|------|-------------|
| id | number | Auto-increment ID |
| user_id | number | Reference to otp_users.id |
| otp_hash | string | HMAC hashed OTP code |
| expires_at | timestamp | Expiration time (5 min) |
| used | boolean | Whether OTP was used |
| context | string | Usage context (login, etc.) |
| created_at | timestamp | Creation date |

## API Endpoints

### Public Endpoints

#### POST `/api/v1/otp-auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "John Doe",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully...",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "John Doe"
  }
}
```

#### POST `/api/v1/otp-auth/login`
Initiate login and receive OTP via Telegram.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your Telegram...",
  "data": {
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 300
  }
}
```

#### POST `/api/v1/otp-auth/verify-otp`
Verify OTP code and complete login.

**Request:**
```json
{
  "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Protected Endpoints (Require Authentication)

#### POST `/api/v1/otp-auth/link-telegram`
Link Telegram account to authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "telegramChatId": "123456789",
  "telegramUsername": "johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Telegram account linked successfully"
}
```

#### GET `/api/v1/otp-auth/status`
Check OTP authentication status.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasTelegramLinked": true,
    "isTelegramVerified": true,
    "telegramUsername": "johndoe"
  }
}
```

## Authentication Flow

### 1. **User Registration**
```
User → POST /otp-auth/register → Create user in otp_users sheet → Success
```

### 2. **Telegram Linking**
```
User → Authenticate with Google (existing flow)
     → POST /otp-auth/link-telegram with Telegram credentials
     → Save to telegram_credentials sheet
     → Success
```

### 3. **Login with OTP**
```
User → POST /otp-auth/login with email/password
     → Verify credentials from otp_users sheet
     → Generate 6-digit OTP code
     → Hash and save to otp_requests sheet
     → Send OTP via Telegram Bot API
     → Return sessionToken

User → Receives OTP on Telegram
     → POST /otp-auth/verify-otp with sessionToken and OTP
     → Verify OTP hash
     → Mark as used in otp_requests sheet
     → Return JWT access & refresh tokens
```

## Environment Variables

Add these to your `.env` file:

```env
# OTP Authentication (already configured)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# JWT (already configured)
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# HMAC for OTP hashing
HMAC_SECRET=your_hmac_secret_min_32_chars

# No PostgreSQL required! Using Google Sheets instead
```

## Setup Instructions

### 1. Configure Environment Variables
Ensure all required variables are set in your `.env` file (see above).

### 2. Initialize OTP Sheets
The OTP sheets will be automatically created in your Google Spreadsheet when:
- User authenticates with Google (existing flow)
- The `initializeOtpService()` function is called with Google auth credentials

The sheets are created once and reused across all sessions.

### 3. Set Up Telegram Bot
1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get the bot token and add to `TELEGRAM_BOT_TOKEN`
3. Get the bot username and add to `TELEGRAM_BOT_USERNAME`

### 4. Test the Integration
```bash
# Start the server
cd apps/backend
pnpm dev

# Test registration
curl -X POST http://localhost:3001/api/v1/otp-auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Link Telegram (requires access token from Google auth)
curl -X POST http://localhost:3001/api/v1/otp-auth/link-telegram \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"telegramChatId":"123456789","telegramUsername":"testuser"}'

# Login with OTP
curl -X POST http://localhost:3001/api/v1/otp-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Verify OTP
curl -X POST http://localhost:3001/api/v1/otp-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"sessionToken":"<session_token>","otpCode":"123456"}'
```

## Security Considerations

### 1. **Password Security**
- Passwords are hashed using bcrypt with configurable rounds (default: 12)
- Never stored in plain text

### 2. **OTP Security**
- OTP codes are hashed using HMAC-SHA256
- Expire after 5 minutes
- Single-use only (marked as used after verification)
- 6-digit codes provide ~1,000,000 possible combinations

### 3. **Token Security**
- Session tokens expire in 10 minutes
- Access tokens configurable (default: 7 days)
- Refresh tokens configurable (default: 30 days)
- All tokens use strong JWT secrets

### 4. **Telegram Security**
- Bot token kept secret in environment variables
- Chat IDs verified through direct messaging
- Username validation

### 5. **Google Sheets Security**
- Uses existing Google OAuth2 authentication
- Spreadsheet access controlled by Google permissions
- No additional database exposed

## Integration with Existing System

### Dual Authentication Methods
Your application now supports two authentication methods:

1. **Google OAuth** (existing)
   - Users authenticate with Google account
   - Access Google Sheets data
   - No password required

2. **Email/Password + OTP** (new)
   - Users create account with email/password
   - Must link Telegram for OTP
   - Login requires both password and OTP code

### Shared Resources
- Both methods use the same Google Sheets spreadsheet
- Both issue compatible JWT tokens
- Both can access the same backend APIs

### Frontend Integration
Update your frontend to:
1. Add registration form for new auth method
2. Add login form with OTP verification step
3. Add Telegram linking interface
4. Handle both authentication flows

## Troubleshooting

### OTP Not Received
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check user has linked Telegram (`/api/v1/otp-auth/status`)
- Ensure bot can send messages to user (user must start conversation with bot first)
- Check bot token permissions with BotFather

### Authentication Fails
- Verify all environment variables are set
- Check Google Sheets API quotas
- Ensure OTP sheets are initialized
- Verify JWT secrets are configured

### Sheets Not Created
- Confirm Google OAuth authentication successful
- Check spreadsheet permissions
- Verify Google Sheets API is enabled
- Check application logs for errors

## Future Enhancements

1. **Recovery Codes** - Implement backup codes for account recovery
2. **Link Tokens** - Add secure Telegram linking flow via bot
3. **Rate Limiting** - Prevent OTP spam/brute force
4. **OTP Cleanup** - Scheduled job to remove expired OTPs
5. **2FA Options** - Add additional 2FA methods (TOTP, email, SMS)
6. **Account Management** - Password reset, email change, etc.

## File Structure

```
apps/backend/src/
├── controllers/
│   └── otp-auth.ts                    # OTP authentication controllers
├── routes/
│   └── otp-auth.ts                    # OTP API routes
├── services/
│   ├── otp-auth-service.ts            # OTP service initialization
│   └── google-sheets-otp-adapter.ts   # Google Sheets adapter
└── index.ts                           # App initialization (OTP integrated)

docs/
└── OTP_TELEGRAM_INTEGRATION.md        # This document
```

## Support

For issues or questions:
1. Check this documentation
2. Review application logs
3. Verify environment configuration
4. Check Google Sheets API status
5. Verify Telegram Bot API status

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0
