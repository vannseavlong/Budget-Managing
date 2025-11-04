// import { Request, Response } from 'express';
// import {
//   GoogleSheetsService,
//   UserCredentials,
// } from '../services/GoogleSheetsService';
// import jwt, { SignOptions } from 'jsonwebtoken';
// import { logger } from '../utils/logger';
// import { z } from 'zod';

// // Validation schemas
// const authCallbackSchema = z.object({
//   code: z.string().min(1, 'Authorization code is required'),
//   state: z.string().optional(),
// });

// const refreshTokenSchema = z.object({
//   refresh_token: z.string().min(1, 'Refresh token is required'),
// });

// export class AuthController {
//   private googleSheetsService: GoogleSheetsService;

//   constructor() {
//     this.googleSheetsService = new GoogleSheetsService();
//   }

//   /**
//    * Initiate Google OAuth flow
//    */
//   initiateAuth = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const authUrl = this.googleSheetsService.getAuthUrl();

//       res.status(200).json({
//         success: true,
//         authUrl,
//         message: 'Please visit this URL to authorize the application',
//       });
//     } catch (error) {
//       logger.error('Error initiating auth:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to initiate authentication',
//       });
//     }
//   };

//   /**
//    * Handle OAuth callback and create user database
//    */
//   handleCallback = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // Validate request query parameters (Google sends code via GET query params)
//       const validatedData = authCallbackSchema.parse(req.query);
//       const { code } = validatedData;

//       // Exchange code for tokens
//       const credentials = await this.googleSheetsService.getTokens(code);
//       this.googleSheetsService.setCredentials(credentials);

//       // Get user info
//       const userInfo = await this.googleSheetsService.getUserInfo();

//       // Get or create user's Google Sheets database (persistent across logins)
//       const spreadsheetId =
//         await this.googleSheetsService.getOrCreateUserDatabase(userInfo.email);

//       // Generate JWT token for our application
//       const jwtSecret =
//         process.env.JWT_SECRET ||
//         'development-secret-key-change-in-production-supersecurekey123456789';
//       console.log('JWT Secret:', jwtSecret ? 'SET' : 'MISSING');

//       if (!jwtSecret) {
//         throw new Error('JWT_SECRET environment variable is not set');
//       }

//       const payload = {
//         email: userInfo.email,
//         name: userInfo.name,
//         spreadsheetId,
//         googleCredentials: credentials,
//       };

//       // Convert expires string to seconds for JWT
//       const expiresInStr = process.env.JWT_EXPIRES_IN || '7d';
//       let expiresInSeconds: number;

//       if (expiresInStr.endsWith('d')) {
//         expiresInSeconds = parseInt(expiresInStr) * 24 * 60 * 60; // days to seconds
//       } else if (expiresInStr.endsWith('h')) {
//         expiresInSeconds = parseInt(expiresInStr) * 60 * 60; // hours to seconds
//       } else {
//         expiresInSeconds = 7 * 24 * 60 * 60; // default 7 days
//       }

//       const jwtToken = jwt.sign(payload, jwtSecret, {
//         expiresIn: expiresInSeconds,
//       });

//       // Store user session info (in production, use Redis or secure storage)
//       const userSession = {
//         email: userInfo.email,
//         name: userInfo.name,
//         spreadsheetId,
//         googleCredentials: credentials,
//         createdAt: new Date().toISOString(),
//       };

//       logger.info(`User authenticated and database created: ${userInfo.email}`);

//       res.status(200).json({
//         success: true,
//         message: 'Authentication successful and database created',
//         user: {
//           email: userInfo.email,
//           name: userInfo.name,
//           spreadsheetId,
//         },
//         token: jwtToken,
//       });
//     } catch (error) {
//       logger.error('Error handling auth callback:', error);
//       res.status(400).json({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Authentication failed',
//       });
//     }
//   };

//   /**
//    * Refresh access token
//    */
//   refreshToken = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const validatedData = refreshTokenSchema.parse(req.body);
//       const { refresh_token } = validatedData;

//       // Set refresh token and get new access token
//       this.googleSheetsService.setCredentials({
//         refresh_token,
//       } as UserCredentials);

//       // In a real implementation, you'd refresh the token here
//       // For now, we'll return a success message
//       res.status(200).json({
//         success: true,
//         message: 'Token refreshed successfully',
//       });
//     } catch (error) {
//       logger.error('Error refreshing token:', error);
//       res.status(400).json({
//         success: false,
//         message: 'Failed to refresh token',
//       });
//     }
//   };

//   /**
//    * Get user profile
//    */
//   getProfile = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // User info is available from JWT middleware
//       const user = (req as any).user;

//       if (!user) {
//         res.status(401).json({
//           success: false,
//           message: 'User not authenticated',
//         });
//         return;
//       }

//       res.status(200).json({
//         success: true,
//         user: {
//           email: user.email,
//           name: user.name,
//           spreadsheetId: user.spreadsheetId,
//         },
//       });
//     } catch (error) {
//       logger.error('Error getting profile:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to get user profile',
//       });
//     }
//   };

//   /**
//    * Validate user's database access
//    */
//   validateDatabase = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const user = (req as any).user;

//       if (!user || !user.googleCredentials || !user.spreadsheetId) {
//         res.status(401).json({
//           success: false,
//           message: 'User not authenticated or database not found',
//         });
//         return;
//       }

//       // Set credentials and validate database
//       this.googleSheetsService.setCredentials(user.googleCredentials);
//       const isValid = await this.googleSheetsService.validateUserDatabase(
//         user.spreadsheetId
//       );

//       if (!isValid) {
//         res.status(400).json({
//           success: false,
//           message: 'Database validation failed. Please re-authenticate.',
//         });
//         return;
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Database is accessible',
//         spreadsheetId: user.spreadsheetId,
//       });
//     } catch (error) {
//       logger.error('Error validating database:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to validate database access',
//       });
//     }
//   };

//   /**
//    * Logout user
//    */
//   logout = async (req: Request, res: Response): Promise<void> => {
//     try {
//       // In a real implementation, you'd invalidate the JWT token
//       // For now, we'll just return a success message
//       res.status(200).json({
//         success: true,
//         message: 'Logged out successfully',
//       });
//     } catch (error) {
//       logger.error('Error during logout:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to logout',
//       });
//     }
//   };

//   /**
//    * Recreate database with updated schema
//    */
//   recreateDatabase = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const user = req.user;
//       if (!user) {
//         res.status(401).json({
//           success: false,
//           message: 'User not authenticated',
//         });
//         return;
//       }

//       // Set the user's Google credentials
//       this.googleSheetsService.setCredentials(user.googleCredentials);

//       // Recreate the database with updated schema
//       await this.googleSheetsService.recreateDatabase(
//         user.spreadsheetId,
//         user.email
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Database schema updated successfully',
//         spreadsheetId: user.spreadsheetId,
//       });
//     } catch (error) {
//       logger.error('Error recreating database:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to recreate database',
//       });
//     }
//   };
// }
