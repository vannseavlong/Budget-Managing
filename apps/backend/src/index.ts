import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { securityMiddleware } from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import dataRoutes from './routes/data';
import categoriesRoutes from './routes/categories';
import transactionsRoutes from './routes/transactions';
import budgetsRoutes from './routes/budgets';
import goalsRoutes from './routes/goals';
import settingsRoutes from './routes/settings';
import telegramRoutes from './routes/telegram';
import sheetsRoutes from './routes/sheets';

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '..', '.env'),
});

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Custom security middleware
app.use(securityMiddleware);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/budgets', budgetsRoutes);
app.use('/api/v1/goals', goalsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/telegram', telegramRoutes);
app.use('/api/v1/sheets', sheetsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    message: 'Budget Managing API with Google Sheets integration',
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
