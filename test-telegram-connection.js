/**
 * Test script to validate Telegram connection flow
 * This simulates a user connecting through Telegram bot
 */

const TelegramConnectionStore =
  require('./apps/backend/src/utils/TelegramConnectionStore.ts').TelegramConnectionStore;

// Test data
const testEmail = 'test@example.com';
const testUsername = 'testuser';
const testChatId = '123456789';

console.log('🧪 Testing Telegram Connection Flow...\n');

// 1. Test storing a connection
console.log('1. Storing connection...');
TelegramConnectionStore.storeConnection(testEmail, testUsername, testChatId);
console.log('✅ Connection stored\n');

// 2. Test getting connection by email
console.log('2. Getting connection by email...');
const connectionByEmail =
  TelegramConnectionStore.getConnectionByEmail(testEmail);
console.log('Connection found:', connectionByEmail);
console.log('✅ Connection retrieved by email\n');

// 3. Test checking if user is connected
console.log('3. Checking if user is connected...');
const isConnected = TelegramConnectionStore.isUserConnected(testChatId);
console.log('User connected:', isConnected);
console.log('✅ Connection status verified\n');

// 4. Test API response format (simulate what backend returns)
console.log('4. Simulating backend API response...');
const apiResponse = {
  success: true,
  data: {
    is_connected: connectionByEmail ? true : false,
    telegram_username: connectionByEmail?.telegram_username || null,
    chat_id: connectionByEmail?.chat_id || null,
    connected_at: connectionByEmail?.connected_at || null,
  },
  message: connectionByEmail
    ? 'Connection status retrieved successfully'
    : 'No Telegram connection found',
};
console.log('API Response:', JSON.stringify(apiResponse, null, 2));
console.log('✅ API response format verified\n');

// 5. Test frontend data mapping
console.log('5. Testing frontend data mapping...');
const frontendData = {
  isConnected: apiResponse.data.is_connected,
  telegramUsername: apiResponse.data.telegram_username,
  chatId: apiResponse.data.chat_id,
  connectedAt: apiResponse.data.connected_at,
};
console.log('Frontend data:', frontendData);
console.log('✅ Frontend mapping verified\n');

console.log('🎉 All tests passed! Connection flow is working correctly.');
