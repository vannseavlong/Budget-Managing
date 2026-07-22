import { Request } from 'express';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        spreadsheetId: string;
        googleCredentials: any;
        userId?: string;
      };
    }
  }
}

export {};
