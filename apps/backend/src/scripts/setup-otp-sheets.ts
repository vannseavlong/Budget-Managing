/**
 * Setup Script for OTP Telegram Integration
 * Creates all required sheets in Google Spreadsheet for OTP authentication
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '../..', '.env'),
});

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';

if (!SPREADSHEET_ID) {
  console.error('❌ GOOGLE_SPREADSHEET_ID not found in environment variables');
  process.exit(1);
}

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Sheet configurations
const OTP_SHEETS = [
  {
    name: 'otp_users',
    headers: ['id', 'email', 'username', 'password_hash', 'is_active', 'created_at', 'updated_at'],
    description: 'User accounts for OTP authentication',
  },
  {
    name: 'telegram_credentials',
    headers: ['id', 'user_id', 'telegram_chat_id', 'telegram_username', 'is_verified', 'linked_at'],
    description: 'Telegram account linkage for OTP users',
  },
  {
    name: 'otp_requests',
    headers: ['id', 'user_id', 'otp_hash', 'expires_at', 'used', 'context', 'created_at'],
    description: 'OTP verification requests',
  },
  {
    name: 'recovery_codes',
    headers: ['id', 'user_id', 'code_hash', 'code_hmac', 'used', 'created_at'],
    description: 'Account recovery codes (reserved for future use)',
  },
  {
    name: 'link_tokens',
    headers: ['id', 'user_id', 'token_hash', 'token_hmac', 'expires_at', 'used', 'created_at'],
    description: 'Telegram linking tokens (reserved for future use)',
  },
];

async function createSheet(sheets: any, sheetName: string, headers: string[]) {
  try {
    // Check if sheet already exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map((s: any) => s.properties.title) || [];

    if (existingSheets.includes(sheetName)) {
      console.log(`  ℹ️  Sheet "${sheetName}" already exists, skipping...`);
      return;
    }

    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Get sheet ID for formatting
    const updatedSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = updatedSpreadsheet.data.sheets?.find(
      (s: any) => s.properties.title === sheetName
    );
    const sheetId = sheet?.properties.sheetId;

    // Format headers (bold + background color)
    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.26,
                      green: 0.52,
                      blue: 0.96,
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0,
                      },
                      bold: true,
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: sheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length,
                },
              },
            },
          ],
        },
      });
    }

    console.log(`  ✅ Created sheet: "${sheetName}" with ${headers.length} columns`);
  } catch (error) {
    console.error(`  ❌ Failed to create sheet "${sheetName}":`, error);
    throw error;
  }
}

async function setupOTPSheets() {
  try {
    console.log('\n🚀 Starting OTP Sheets Setup...\n');
    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

    // Note: This script requires manual OAuth token
    console.log('⚠️  This script requires OAuth2 access token.');
    console.log('Please ensure you have authenticated via the web app first.\n');

    // For manual setup, you would need to get the access token from a logged-in user
    // This is a placeholder - in production, you'd initialize this after user authentication
    
    console.log('📋 Required sheets to create:\n');
    OTP_SHEETS.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.name}`);
      console.log(`   Description: ${sheet.description}`);
      console.log(`   Columns: ${sheet.headers.join(', ')}\n`);
    });

    console.log('\n💡 How to initialize OTP sheets:\n');
    console.log('1. Start your backend server: pnpm dev');
    console.log('2. Authenticate via Google OAuth in your web app');
    console.log('3. The OTP sheets will be created automatically on first authentication');
    console.log('4. Check your Google Spreadsheet for the new sheets\n');

    console.log('✅ Setup information displayed successfully!\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupOTPSheets();
