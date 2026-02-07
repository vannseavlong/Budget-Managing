/**
 * OTP Authentication Service
 * Integrates Google Sheets-based OTP authentication
 */

import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { initializeOTPAdapter } from '../controllers/otp-auth';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'JWT_SECRET',
  'HMAC_SECRET',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(
    `⚠️  Warning: Missing required OTP environment variables: ${missingVars.join(', ')}`
  );
  console.warn('OTP Telegram authentication may not work correctly.');
}

/**
 * Initialize OTP service with Google Sheets
 * Call this during application startup with Google Sheets auth
 */
export const initializeOtpService = async (auth?: any, spreadsheetId?: string) => {
  try {
    if (!auth || !spreadsheetId) {
      logger.warn('⚠️  OTP service not initialized: Google Sheets auth or spreadsheet ID not provided');
      logger.info('OTP authentication will be available once user authenticates with Google');
      return false;
    }

    logger.info('🔄 Initializing OTP Telegram service with Google Sheets...');
    
    // Initialize the OTP adapter with Google Sheets
    await initializeOTPAdapter(auth, spreadsheetId);
    
    logger.info('✅ OTP Telegram service initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize OTP service:', error);
    throw error;
  }
};

export default {
  initializeOtpService,
};
