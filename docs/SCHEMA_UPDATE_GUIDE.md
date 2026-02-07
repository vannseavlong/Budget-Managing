# Schema Update System - Quick Guide

## How Old Users Get Updates

When you add new tables/columns, **old users automatically get them** when they:
1. Log in to the app
2. Access their spreadsheet through any API endpoint

**No manual action needed from users!**

## How New Users Get Correct Schema

New users **always get the latest schema** when they:
1. Sign up with Google OAuth
2. Create their first spreadsheet

**They automatically get all sheets and columns!**

## How to Add New Tables/Columns

### Step 1: Edit `schema-versions.ts`

```typescript
// 1. Increment version number
export const CURRENT_SCHEMA_VERSION = 3; // Change from 2 to 3

// 2. Add new table to BASE_SCHEMA
export const BASE_SCHEMA = {
  // ... existing tables ...
  my_new_table: ['id', 'user_id', 'name', 'created_at'], // NEW TABLE
};

// 3. Document the migration
export const SCHEMA_MIGRATIONS = [
  // ... existing migrations ...
  {
    version: 3,
    description: 'Added my_new_table',
    newSheets: ['my_new_table'], // List new sheets
    sheetUpdates: [ // Optional: add columns to existing sheets
      {
        sheetName: 'users',
        newColumns: ['new_column'],
      },
    ],
  },
];
```

### Step 2: Deploy

That's it! The system handles everything:
- ✅ Old users get new sheets/columns on next login
- ✅ New users get complete schema from start
- ✅ Existing data is preserved
- ✅ Hidden version tracking

## Where Files Are

```
apps/backend/src/services/googleSheets/
├── schema-versions.ts        ← Edit this to add tables/columns
├── schema-migration.ts       ← Migration engine (don't edit)
└── database.ts              ← Auto-uses migration system
```

## Check Migration Status

**API Endpoints:**
- `GET /api/v1/sheets/schema/status` - Check if migration needed
- `POST /api/v1/sheets/schema/migrate` - Manually trigger migration

## Current Schema

**Version 1:** Base tables (users, settings, categories, transactions, budgets, etc.)  
**Version 2:** OTP authentication (otp_users, telegram_credentials, otp_requests, etc.)

## Example: Current OTP Tables (Added in Version 2)

When old users logged in after OTP integration, they automatically got 5 new sheets:
- `otp_users`
- `telegram_credentials`  
- `otp_requests`
- `recovery_codes`
- `link_tokens`

Plus new columns on existing sheets:
- `users.telegram_username`
- `users.chatId`
- `categories.emoji`

## Safety

✅ **Safe to do:**
- Add new sheets
- Add new columns
- Update formatting

❌ **Never do:**
- Delete sheets (loses user data)
- Rename columns (breaks existing code)
- Change column order (confusing)

## Full Documentation

See [SCHEMA_MIGRATION.md](/docs/SCHEMA_MIGRATION.md) for complete details.
