import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetItems,
  getAllBudgetItems,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from '../controllers/budgets';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/budgets:
 *   get:
 *     summary: Get all budgets
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getBudgets);

// Backwards-compatible alias: /monthly -> same as GET / (with year & month query params)
router.get('/monthly', getBudgets);
// GET /api/v1/budgets/items - list budget items for user (optional ?budget_id=...)
router.get('/items', getAllBudgetItems);

/**
 * @swagger
 * /api/v1/budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *               - income
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2025
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 11
 *               income:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Budget created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', createBudget);

/**
 * @swagger
 * /api/v1/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Budget not found
 */
router.put('/:id', updateBudget);

/**
 * @swagger
 * /api/v1/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Budget not found
 */
router.delete('/:id', deleteBudget);

/**
 * @swagger
 * /api/v1/budgets/{budgetId}/items:
 *   get:
 *     summary: Get budget items for a specific budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Budget not found
 */
router.get('/:budgetId/items', getBudgetItems);

/**
 * @swagger
 * /api/v1/budgets/items:
 *   post:
 *     summary: Create a new budget item
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget_id
 *               - category_id
 *               - category_name
 *               - amount
 *             properties:
 *               budget_id:
 *                 type: string
 *               category_id:
 *                 type: string
 *               category_name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Budget item created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/items', createBudgetItem);

/**
 * @swagger
 * /api/v1/budgets/items/{id}:
 *   put:
 *     summary: Update a budget item
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget item updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Budget item not found
 */
router.put('/items/:id', updateBudgetItem);

/**
 * @swagger
 * /api/v1/budgets/items/{id}:
 *   delete:
 *     summary: Delete a budget item
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget item deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Budget item not found
 */
router.delete('/items/:id', deleteBudgetItem);

export default router;
