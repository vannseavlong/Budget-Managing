import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createUserDatabase,
  setupDatabaseSchema,
  validateDatabaseSchema,
  getSpreadsheetInfo,
  shareSpreadsheet,
  exportData,
  importData,
  initializeSchema,
  createBackup,
} from '../controllers/sheets';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/sheets/create:
 *   post:
 *     summary: Create a new Google Sheets database for the user
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Budget Manager"
 *               template:
 *                 type: string
 *                 enum: [default, basic, advanced]
 *                 default: default
 *     responses:
 *       201:
 *         description: Google Sheets database created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create spreadsheet
 */
router.post('/create', createUserDatabase);

/**
 * @swagger
 * /api/v1/sheets/setup-schema:
 *   post:
 *     summary: Setup database schema in the user's Google Sheet (REQUIRED STEP)
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database schema setup completed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to setup database schema
 */
router.post('/setup-schema', setupDatabaseSchema);

/**
 * @swagger
 * /api/v1/sheets/validate-schema:
 *   get:
 *     summary: Validate if database schema is properly set up
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schema validation completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to validate schema
 */
router.get('/validate-schema', validateDatabaseSchema);

/**
 * @swagger
 * /api/v1/sheets/info:
 *   get:
 *     summary: Get spreadsheet information
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Spreadsheet information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.get('/info', getSpreadsheetInfo);

/**
 * @swagger
 * /api/v1/sheets/share:
 *   post:
 *     summary: Share spreadsheet with another user
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "friend@example.com"
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, owner]
 *                 default: viewer
 *     responses:
 *       200:
 *         description: Spreadsheet shared successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.post('/share', shareSpreadsheet);

/**
 * @swagger
 * /api/v1/sheets/export:
 *   get:
 *     summary: Export spreadsheet data
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, xlsx, pdf]
 *           default: json
 *       - in: query
 *         name: sheets
 *         schema:
 *           type: string
 *           description: Comma-separated list of sheet names to export
 *     responses:
 *       200:
 *         description: Data export prepared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.get('/export', exportData);

/**
 * @swagger
 * /api/v1/sheets/import:
 *   post:
 *     summary: Import data into spreadsheet
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - sheet_name
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *               sheet_name:
 *                 type: string
 *                 example: "transactions"
 *               mode:
 *                 type: string
 *                 enum: [append, overwrite, insert]
 *                 default: append
 *     responses:
 *       200:
 *         description: Data imported successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.post('/import', importData);

/**
 * @swagger
 * /api/v1/sheets/schema/init:
 *   post:
 *     summary: Initialize spreadsheet with schema
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Spreadsheet schema initialized successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.post('/schema/init', initializeSchema);

/**
 * @swagger
 * /api/v1/sheets/backup:
 *   post:
 *     summary: Create a backup of the spreadsheet
 *     tags: [Google Sheets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Backup created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No spreadsheet found for user
 */
router.post('/backup', createBackup);

export default router;
