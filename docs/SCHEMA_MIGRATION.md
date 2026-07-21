# Google Sheets Schema Migration System

## Overview

This document explains how the Budget Managing app handles Google Sheets schema updates to ensure both **existing users** get new features automatically and **new users** always get the latest schema.

## How It Works

### 1. **Automatic Migration for Existing Users**

When an existing user logs in or accesses their spreadsheet:

1. The system checks their current schema version (stored in hidden `schema_version` sheet)
2. Compares it with the latest version (`CURRENT_SCHEMA_VERSION`)
3. If outdated, automatically applies all missing migrations
4. Updates the version number when complete

**User Experience:**
- ✅ Completely automatic - no user action needed
- ✅ Non-destructive - existing data is preserved
- ✅ Only adds new sheets/columns, never removes
- ✅ Happens on login or first API call

### 2. **Complete Schema for New Users**

When a new user creates an account:

1. System creates a new Google Spreadsheet
2. Uses `ensureAllSheetsExist()` to create all sheets at current version
3. Sets schema version to latest
4. User starts with complete, up-to-date schema

### 3. **Schema Version Tracking**

The system maintains a hidden sheet called `schema_version` that contains:
- Current version number
- Hidden from users (they won't see it in their spreadsheet)
- Automatically managed by the migration system

## File Structure

```
apps/backend/src/services/googleSheets/
├── schema-versions.ts       # Schema definitions and migrations
├── schema-migration.ts      # Migration engine
└── database.ts             # Uses migration system
```

## Adding New Tables or Columns

### Example: Adding a New "Accounts" Table

**Step 1:** Update `schema-versions.ts`

```typescript
// Increment the version number
export const CURRENT_SCHEMA_VERSION = 3; // Was 2, now 3

// Add new table to BASE_SCHEMA
export const BASE_SCHEMA: Record<string, string[]> = {
  // ... existing tables ...
  accounts: [
    'id',
    'user_id',
    'name',
    'type',
    'balance',
    'created_at',
    'updated_at',
  ],
};

// Add migration description
export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  // ... existing migrations ...
  {
    version: 3,
    description: 'Added accounts table for multi-account support',
    newSheets: ['accounts'],
    sheetUpdates: [
      {
        sheetName: 'transactions',
        newColumns: ['account_id'], // Add account reference to transactions
      },
    ],
  },
];
```

**Step 2:** That's it! The migration runs automatically.

### Example: Adding Columns to Existing Table

```typescript
export const CURRENT_SCHEMA_VERSION = 4;

// Update BASE_SCHEMA
export const BASE_SCHEMA: Record<string, string[]> = {
  categories: [
    'id',
    'user_id',
    'name',
    'emoji',
    'color',
    'icon_url',        // NEW COLUMN
    'description',     // NEW COLUMN
    'created_at',
    'updated_at',
  ],
};

// Add migration
export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  // ... existing migrations ...
  {
    version: 4,
    description: 'Added icon_url and description to categories',
    sheetUpdates: [
      {
        sheetName: 'categories',
        newColumns: ['icon_url', 'description'],
      },
    ],
  },
];
```

## API Endpoints

### Check Schema Status

```bash
GET /api/v1/sheets/schema/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentVersion": 1,
    "latestVersion": 2,
    "isUpToDate": false,
    "missingSheets": ["otp_users", "telegram_credentials"]
  },
  "message": "Schema migration available"
}
```

### Manually Trigger Migration

```bash
POST /api/v1/sheets/schema/migrate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentVersion": 2,
    "latestVersion": 2,
    "isUpToDate": true,
    "missingSheets": []
  },
  "message": "Schema migration completed successfully"
}
```

## Migration Safety Features

### ✅ Safe Operations
- Adding new sheets
- Adding new columns to existing sheets
- Updating header formatting
- Non-destructive updates

### ❌ Avoided Operations
- Deleting sheets (would lose user data)
- Renaming columns (would break existing data)
- Changing data types (could corrupt data)
- Reordering columns (confusing for users)

## Current Schema (Version 2)

### Base Tables (Version 1)
- `users` - User accounts
- `settings` - User preferences
- `categories` - Expense categories
- `transactions` - Financial transactions
- `budgets` - Monthly budgets
- `budget_items` - Budget category allocations
- `budget_incomes` - Income tracking
- `goals` - Spending goals/limits
- `telegram_messages` - Telegram notification log

### OTP Authentication Tables (Version 2)
- `otp_users` - Email/password users
- `telegram_credentials` - Telegram account links
- `otp_requests` - OTP verification codes
- `recovery_codes` - Account recovery codes
- `link_tokens` - Telegram linking tokens

### Enhanced Columns (Version 2)
- `users.telegram_username` - Telegram username
- `users.chatId` - Telegram chat ID
- `categories.emoji` - Category emoji icon

## Testing Migration

### For Developers

```typescript
// Check if migration is needed
const status = await getSchemaStatus(spreadsheetId);
console.log('Current version:', status.currentVersion);
console.log('Latest version:', status.latestVersion);
console.log('Needs migration:', !status.isUpToDate);

// Manually trigger migration
await migrateSchema(spreadsheetId);

// Verify all sheets exist
await ensureAllSheetsExist(spreadsheetId);
```

### For Users

Users don't need to do anything! Migrations happen automatically when they:
1. Log in to the app
2. Make their first API call after an update
3. Access their spreadsheet

## Logging

Migration progress is logged for debugging:

```
[INFO] Current schema version: 1
[INFO] Target schema version: 2
[INFO] Applying migration v2: Added OTP authentication tables
[INFO] Created new sheet: otp_users with 7 columns
[INFO] Added 2 new columns to users: telegram_username, chatId
[INFO] Migration v2 completed successfully
[INFO] Schema migration completed: v1 → v2
```

## Best Practices

### 1. **Always Increment Version**
Every schema change requires incrementing `CURRENT_SCHEMA_VERSION`

### 2. **Descriptive Migration Names**
Use clear descriptions: "Added accounts table" not "Update 3"

### 3. **Test Before Deploying**
Test migrations on dev spreadsheet first

### 4. **Document Breaking Changes**
If migration requires user action, document in release notes

### 5. **Never Delete**
Never remove columns or sheets - only add new ones

### 6. **Backwards Compatible**
New code should work with both old and new schemas during migration

## Troubleshooting

### Migration Failed

If migration fails, users can:
1. Check `/api/v1/sheets/schema/status` to see what's missing
2. Manually trigger with `/api/v1/sheets/schema/migrate`
3. Contact support with error logs

### Missing Sheets

If sheets are missing but version is current:
```typescript
await ensureAllSheetsExist(spreadsheetId);
```

### Schema Corruption

If schema is corrupted:
1. Use `recreateDatabase()` to rebuild (loses data)
2. Or manually fix sheets and re-run migration

## Future Enhancements

Potential improvements to the migration system:

- [ ] Rollback capability for failed migrations
- [ ] Data transformation functions (e.g., format changes)
- [ ] Migration dry-run mode (preview changes)
- [ ] Admin dashboard for monitoring migrations
- [ ] Batch migration for multiple users
- [ ] Schema diff viewer
- [ ] Automatic backup before migration

## Summary

The schema migration system ensures:

✅ **Old users** automatically get new features when they update  
✅ **New users** always get the latest schema from day one  
✅ **Zero downtime** - migrations happen seamlessly  
✅ **Data safety** - existing data is never lost  
✅ **Easy updates** - just update `schema-versions.ts` and deploy  

This makes maintaining and evolving the Google Sheets database as easy as traditional SQL migrations!
