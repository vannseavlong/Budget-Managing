# OTP Telegram - Google Sheets Structure

## Overview

Your Google Spreadsheet needs the following sheets (tabs) for OTP authentication to work. These are **separate from** your existing `users` sheet which is used for Google OAuth.

## Required Sheets

### 1. **otp_users** (OTP User Accounts)

Stores users who authenticate with email/password + OTP.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | number | Auto-increment user ID | 1 |
| `email` | string | User email (unique) | user@example.com |
| `username` | string | Display name | John Doe |
| `password_hash` | string | Bcrypt hashed password | $2a$12$... |
| `is_active` | boolean | Account active status | TRUE |
| `created_at` | timestamp | Account creation date | 2026-02-04T10:30:00.000Z |
| `updated_at` | timestamp | Last update date | 2026-02-04T10:30:00.000Z |

**Note:** This is different from your existing `users` sheet which stores Google OAuth users.

---

### 2. **telegram_credentials** (Telegram Linkage)

Links Telegram accounts to OTP users.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | number | Auto-increment ID | 1 |
| `user_id` | number | Reference to otp_users.id | 1 |
| `telegram_chat_id` | string | Telegram chat ID | 847989947 |
| `telegram_username` | string | Telegram @username | @johndoe |
| `is_verified` | boolean | Verification status | TRUE |
| `linked_at` | timestamp | Link date | 2026-02-04T10:35:00.000Z |

---

### 3. **otp_requests** (OTP Verification)

Stores active OTP codes for verification.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | number | Auto-increment ID | 1 |
| `user_id` | number | Reference to otp_users.id | 1 |
| `otp_hash` | string | HMAC hashed OTP code | a3f2b1c... |
| `expires_at` | timestamp | Expiration time (5 min) | 2026-02-04T10:40:00.000Z |
| `used` | boolean | Whether OTP was used | FALSE |
| `context` | string | Usage context | login |
| `created_at` | timestamp | Creation date | 2026-02-04T10:35:00.000Z |

**Auto-cleanup:** Expired OTPs can be cleaned periodically.

---

### 4. **recovery_codes** (Account Recovery)

Stores backup recovery codes (reserved for future use).

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | number | Auto-increment ID | 1 |
| `user_id` | number | Reference to otp_users.id | 1 |
| `code_hash` | string | Hashed recovery code | b4e3c2d... |
| `code_hmac` | string | HMAC of recovery code | c5f4d3e... |
| `used` | boolean | Whether code was used | FALSE |
| `created_at` | timestamp | Creation date | 2026-02-04T10:35:00.000Z |

---

### 5. **link_tokens** (Telegram Linking)

Stores temporary tokens for linking Telegram (reserved for future use).

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | number | Auto-increment ID | 1 |
| `user_id` | number | Reference to otp_users.id | 1 |
| `token_hash` | string | Hashed link token | d6g5e4f... |
| `token_hmac` | string | HMAC of token | e7h6f5g... |
| `expires_at` | timestamp | Expiration time | 2026-02-04T11:35:00.000Z |
| `used` | boolean | Whether token was used | FALSE |
| `created_at` | timestamp | Creation date | 2026-02-04T10:35:00.000Z |

---

## Relationship with Existing `users` Sheet

Your existing `users` sheet is for **Google OAuth authentication**. The OTP sheets are for **email/password authentication**. They are separate systems:

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Spreadsheet                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 users (Google OAuth)                                     │
│     - id, name, email, telegram_use_chatId, etc.            │
│                                                              │
│  🔐 otp_users (Email/Password + OTP)                        │
│     - id, email, username, password_hash, etc.              │
│                                                              │
│  💬 telegram_credentials (OTP Telegram Linkage)             │
│     - id, user_id, telegram_chat_id, etc.                   │
│                                                              │
│  🔑 otp_requests (OTP Verification Codes)                   │
│     - id, user_id, otp_hash, expires_at, etc.               │
│                                                              │
│  🆘 recovery_codes (Account Recovery)                       │
│     - id, user_id, code_hash, etc.                          │
│                                                              │
│  🔗 link_tokens (Telegram Linking Tokens)                   │
│     - id, user_id, token_hash, expires_at, etc.             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Automatic Initialization

**Good news!** You don't need to manually create these sheets. They will be automatically created when:

1. A user authenticates with Google OAuth (your existing flow)
2. The backend receives the Google Sheets auth credentials
3. The `initializeOTPAdapter()` function is called
4. The system creates all 5 OTP sheets automatically

## Manual Initialization (Optional)

If you want to create the sheets manually or check the setup:

```bash
# Run the setup script
cd apps/backend
pnpm tsx src/scripts/setup-otp-sheets.ts
```

This will show you what sheets need to be created.

## Verification

After the sheets are created, your spreadsheet should have these tabs:

- ✅ Sheet1 (or your default sheet)
- ✅ users (existing Google OAuth users)
- ✅ settings (your existing settings)
- ✅ categories (your existing categories)
- ✅ transactions (your existing transactions)
- ✅ budgets (your existing budgets)
- ✅ budget_incomes (your existing budget incomes)
- ✅ budget_items (your existing budget items)
- ✅ goals (your existing goals)
- ✅ telegram_messages (your existing messages)
- 🆕 **otp_users** (new OTP authentication)
- 🆕 **telegram_credentials** (new OTP Telegram linkage)
- 🆕 **otp_requests** (new OTP codes)
- 🆕 **recovery_codes** (new recovery codes)
- 🆕 **link_tokens** (new linking tokens)

## Testing

Once the sheets are created, you can test the OTP flow:

### 1. Register a new OTP user
```bash
curl -X POST http://localhost:3001/api/v1/otp-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "Test User",
    "password": "SecurePass123!"
  }'
```

Check the `otp_users` sheet - you should see a new row.

### 2. Link Telegram
First authenticate with Google, then:
```bash
curl -X POST http://localhost:3001/api/v1/otp-auth/link-telegram \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_google_token>" \
  -d '{
    "telegramChatId": "YOUR_CHAT_ID",
    "telegramUsername": "your_username"
  }'
```

Check the `telegram_credentials` sheet - you should see a new row.

### 3. Login with OTP
```bash
curl -X POST http://localhost:3001/api/v1/otp-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Check the `otp_requests` sheet - you should see a new OTP request row.

---

## Troubleshooting

### Sheets Not Created?
- Ensure you've authenticated via Google OAuth first
- Check backend logs for initialization errors
- Verify `GOOGLE_SPREADSHEET_ID` in your .env
- Ensure Google Sheets API is enabled

### Can't Find Sheets?
- Scroll through all tabs at the bottom of your spreadsheet
- Sheets are created with blue headers
- Check if they were created with different names

### Data Not Saving?
- Check Google Sheets API quota limits
- Verify authentication hasn't expired
- Check backend logs for Google API errors

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0
