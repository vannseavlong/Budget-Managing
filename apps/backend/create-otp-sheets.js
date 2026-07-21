/**
 * Manual OTP Sheets Creator
 * Run this once to create the OTP sheets in your Google Spreadsheet
 * Usage: node create-otp-sheets.js
 */

const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1GUOeoiiToUk77R1nccP120sWLfSTBjLJdxiQyjROQDg';

// You'll need to paste your access token here from a logged-in session
const ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN || 'PASTE_YOUR_ACCESS_TOKEN_HERE';

const OTP_SHEETS = [
  {
    name: 'otp_users',
    headers: ['id', 'email', 'username', 'password_hash', 'is_active', 'created_at', 'updated_at'],
  },
  {
    name: 'telegram_credentials',
    headers: ['id', 'user_id', 'telegram_chat_id', 'telegram_username', 'is_verified', 'linked_at'],
  },
  {
    name: 'otp_requests',
    headers: ['id', 'user_id', 'otp_hash', 'expires_at', 'used', 'context', 'created_at'],
  },
  {
    name: 'recovery_codes',
    headers: ['id', 'user_id', 'code_hash', 'code_hmac', 'used', 'created_at'],
  },
  {
    name: 'link_tokens',
    headers: ['id', 'user_id', 'token_hash', 'token_hmac', 'expires_at', 'used', 'created_at'],
  },
];

async function createOTPSheets() {
  try {
    console.log('\n🚀 Creating OTP sheets in Google Spreadsheet...\n');
    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

    // Create OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: ACCESS_TOKEN,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get existing sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties.title) || [];
    console.log('📋 Existing sheets:', existingSheets.join(', '), '\n');

    // Create each OTP sheet
    for (const sheetConfig of OTP_SHEETS) {
      if (existingSheets.includes(sheetConfig.name)) {
        console.log(`  ⏭️  "${sheetConfig.name}" already exists, skipping...`);
        continue;
      }

      try {
        // Create sheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetConfig.name,
                },
              },
            }],
          },
        });

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetConfig.name}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheetConfig.headers],
          },
        });

        // Get sheet ID for formatting
        const updated = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });
        const sheet = updated.data.sheets?.find((s) => s.properties.title === sheetConfig.name);
        const sheetId = sheet?.properties.sheetId;

        // Format headers
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
                        backgroundColor: { red: 0.26, green: 0.52, blue: 0.96 },
                        textFormat: {
                          foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
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
                      endIndex: sheetConfig.headers.length,
                    },
                  },
                },
              ],
            },
          });
        }

        console.log(`  ✅ Created "${sheetConfig.name}" with ${sheetConfig.headers.length} columns`);
      } catch (error) {
        console.error(`  ❌ Failed to create "${sheetConfig.name}":`, error.message);
      }
    }

    console.log('\n✅ OTP sheets creation complete!\n');
    console.log('🔗 View your spreadsheet: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
    console.log('');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 To get an access token:');
    console.log('1. Login to your app via Google OAuth');
    console.log('2. Open browser DevTools → Application → Local Storage');
    console.log('3. Find and copy the "accessToken" value');
    console.log('4. Set GOOGLE_ACCESS_TOKEN in .env or paste above\n');
    process.exit(1);
  }
}

createOTPSheets();
